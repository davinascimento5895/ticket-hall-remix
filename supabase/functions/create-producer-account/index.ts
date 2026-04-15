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
    // Authenticate — only admins can create producer accounts
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminId = claimsData.claims.sub as string;

    // Verify admin role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: adminId,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Only admins can create producer accounts" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { producerId } = await req.json();
    if (!producerId) {
      return new Response(
        JSON.stringify({ error: "producerId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch producer profile
    const { data: producer, error: prodErr } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", producerId)
      .single();

    if (prodErr || !producer) {
      return new Response(
        JSON.stringify({ error: "Producer not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if already has Asaas account
    if (producer.asaas_wallet_id) {
      return new Response(
        JSON.stringify({
          success: true,
          alreadyExists: true,
          walletId: producer.asaas_wallet_id,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get producer email from auth
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(producerId);
    const producerEmail = authUser?.user?.email;

    // ─── Check if Asaas is configured ───
    const asaasBaseUrl = Deno.env.get("ASAAS_BASE_URL");
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");

    if (!asaasBaseUrl || !asaasApiKey) {
      console.log("ASAAS_NOT_CONFIGURED — approving producer without Asaas sub-account");

      // Still approve the producer, just without Asaas
      await supabaseAdmin
        .from("profiles")
        .update({ producer_status: "approved" })
        .eq("id", producerId);

      // Ensure producer role exists
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", producerId)
        .eq("role", "producer")
        .maybeSingle();

      if (!existingRole) {
        await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: producerId, role: "producer" });
      }

      return new Response(
        JSON.stringify({
          success: true,
          stub: true,
          message: "Producer approved without Asaas account (gateway not configured).",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ─── REAL Asaas flow: Create sub-account ───
    const accountPayload: Record<string, unknown> = {
      name: producer.full_name || "Produtor TicketHall",
      email: producerEmail,
      cpfCnpj: producer.document_number?.replace(/\D/g, "") || undefined,
      mobilePhone: producer.phone?.replace(/\D/g, "") || undefined,
      companyType: "MEI",
      incomeValue: 1000, // default — producer can update later
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

    if (accountResult.errors || !accountResult.walletId) {
      console.error("Asaas account creation failed:", accountResult);

      // Still approve producer even if Asaas fails
      await supabaseAdmin
        .from("profiles")
        .update({ producer_status: "approved" })
        .eq("id", producerId);

      return new Response(
        JSON.stringify({
          success: true,
          asaasError: true,
          message: "Producer approved but Asaas sub-account creation failed.",
          details: accountResult.errors,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Save Asaas data and approve
    await supabaseAdmin
      .from("profiles")
      .update({
        asaas_wallet_id: accountResult.walletId,
        asaas_account_id: accountResult.id,
        asaas_account_key: accountResult.apiKey || null,
        producer_status: "approved",
      })
      .eq("id", producerId);

    // Ensure producer role
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", producerId)
      .eq("role", "producer")
      .maybeSingle();

    if (!existingRole) {
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: producerId, role: "producer" });
    }

    console.log("Producer account created:", {
      producerId,
      walletId: accountResult.walletId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        walletId: accountResult.walletId,
        accountId: accountResult.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("create-producer-account error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
