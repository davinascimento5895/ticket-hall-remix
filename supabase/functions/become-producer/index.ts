import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
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
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { cpf, phone } = await req.json();

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

    if (existingRole) {
      return new Response(
        JSON.stringify({ success: true, alreadyProducer: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update profile with CPF and phone, set status to approved immediately
    const updates: Record<string, string> = {
      producer_status: "approved",
    };
    if (cpf) updates.cpf = cpf.replace(/\D/g, "");
    if (phone) updates.phone = phone.replace(/\D/g, "");

    await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    // Grant producer role immediately
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: user.id, role: "producer" }, { onConflict: "user_id,role" });

    // Try to create Asaas sub-account (non-blocking)
    const asaasBaseUrl = Deno.env.get("ASAAS_BASE_URL");
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");

    if (asaasBaseUrl && asaasApiKey) {
      try {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("full_name, cpf, phone")
          .eq("id", user.id)
          .single();

        const accountPayload: Record<string, unknown> = {
          name: profile?.full_name || "Produtor TicketHall",
          email: user.email,
          cpfCnpj: (cpf || profile?.cpf || "").replace(/\D/g, "") || undefined,
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
        console.warn("Asaas error (non-blocking):", asaasErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, status: "approved" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("become-producer error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
