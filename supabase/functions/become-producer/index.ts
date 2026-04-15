import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    console.info("[become-producer] request", {
      method: req.method,
      hasAuthHeader: !!authHeader,
      authHeaderPrefix: authHeader ? authHeader.slice(0, 24) : null,
      supabaseUrl: !!Deno.env.get("SUPABASE_URL"),
      supabaseAnonKey: !!Deno.env.get("SUPABASE_ANON_KEY"),
      supabaseServiceRoleKey: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    });
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[become-producer] missing or malformed Authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized", code: "MISSING_AUTH_HEADER" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    console.info("[become-producer] auth lookup", {
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      error: userError?.message ?? null,
    });
    if (userError || !user) {
      console.error("[become-producer] invalid token", { message: userError?.message ?? null });
      return new Response(JSON.stringify({ error: "Unauthorized", code: "INVALID_TOKEN" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { document_number, document_type, cpf, phone } = await req.json();
    console.info("[become-producer] payload", {
      userId: user.id,
      hasDocumentNumber: !!document_number,
      hasCpf: !!cpf,
      documentType: document_type ?? null,
      phoneLength: typeof phone === "string" ? phone.length : null,
    });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if already a producer
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "producer")
      .maybeSingle();
    console.info("[become-producer] role lookup", {
      userId: user.id,
      alreadyProducer: !!existingRole,
    });

    if (existingRole) {
      console.info("[become-producer] user already had producer role", { userId: user.id });
      return new Response(
        JSON.stringify({ success: true, alreadyProducer: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizeDocument = (value: string) => value.replace(/\D/g, "");
    const rawDocument = String(document_number || cpf || "");
    const cleanDocument = normalizeDocument(rawDocument);
    const resolvedDocumentType = document_type || (cleanDocument.length === 14 ? "cnpj" : "cpf");

    // Update profile with document and phone, set status to approved immediately
    const updates: Record<string, string> = {
      producer_status: "approved",
    };
    if (cleanDocument) {
      updates.document_number = cleanDocument;
      updates.document_type = resolvedDocumentType;
    }
    if (phone) updates.phone = phone.replace(/\D/g, "");

    console.info("[become-producer] profile update payload", {
      userId: user.id,
      updates,
    });

    const profileUpdate = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", user.id);
    console.info("[become-producer] profile update result", {
      userId: user.id,
      error: profileUpdate.error?.message ?? null,
    });

    // Grant producer role immediately
    const roleUpsert = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: user.id, role: "producer" }, { onConflict: "user_id,role" });
    console.info("[become-producer] role upsert result", {
      userId: user.id,
      error: roleUpsert.error?.message ?? null,
    });

    // Try to create Asaas sub-account (non-blocking)
    const asaasBaseUrl = Deno.env.get("ASAAS_BASE_URL");
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
    console.info("[become-producer] asaas config", {
      hasBaseUrl: !!asaasBaseUrl,
      hasApiKey: !!asaasApiKey,
    });

    if (asaasBaseUrl && asaasApiKey) {
      try {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("full_name, document_number, document_type, phone")
          .eq("id", user.id)
          .single();

        const accountPayload: Record<string, unknown> = {
          name: profile?.full_name || "Produtor TicketHall",
          email: user.email,
          cpfCnpj: cleanDocument || profile?.document_number || undefined,
          mobilePhone: (phone || profile?.phone || "").replace(/\D/g, "") || undefined,
          companyType: "MEI",
          incomeValue: 1000,
        };

        const res = await fetch(`${asaasBaseUrl}/accounts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            access_token: asaasApiKey,
          },
          body: JSON.stringify(accountPayload),
        });

        const accountResult = await res.json();
        console.info("[become-producer] asaas account response", {
          userId: user.id,
          status: res.status,
          walletId: accountResult.walletId ?? null,
          id: accountResult.id ?? null,
          error: accountResult.message ?? accountResult.errors ?? null,
        });

        if (accountResult.walletId) {
          await supabaseAdmin
            .from("profiles")
            .update({
              asaas_wallet_id: accountResult.walletId,
              asaas_account_id: accountResult.id,
              asaas_account_key: accountResult.apiKey || null,
            })
            .eq("id", user.id);
        } else {
          console.warn("Asaas sub-account creation failed (non-blocking):", accountResult);
        }
      } catch (asaasErr) {
        console.warn("[become-producer] Asaas error (non-blocking)", asaasErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, status: "approved" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[become-producer] internal error", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error", code: "INTERNAL_ERROR" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
