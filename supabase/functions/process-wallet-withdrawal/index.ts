// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const asaas = async (method: string, path: string, body?: unknown) => {
  const baseUrl = Deno.env.get("ASAAS_BASE_URL");
  const apiKey = Deno.env.get("ASAAS_API_KEY");
  if (!baseUrl || !apiKey) return { _notConfigured: true };

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  if (!text) {
    if (!res.ok) return { errors: [{ description: `Gateway returned HTTP ${res.status}` }] };
    return { _empty: true };
  }

  try {
    return JSON.parse(text);
  } catch {
    return { errors: [{ description: `Gateway non-JSON HTTP ${res.status}` }] };
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: authData, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminUserId = authData.user.id;
    const { data: isAdmin } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", adminUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (!isAdmin) {
      return new Response(JSON.stringify({ success: false, error: "Somente admins podem processar saques" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { withdrawalId, approve } = await req.json();
    if (!withdrawalId || typeof approve !== "boolean") {
      return new Response(JSON.stringify({ success: false, error: "withdrawalId e approve são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: withdrawal } = await supabaseAdmin
      .from("wallet_withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single();

    if (!withdrawal) {
      return new Response(JSON.stringify({ success: false, error: "Saque não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!approve) {
      const { data: reverted, error: revertErr } = await supabaseAdmin.rpc("finalize_wallet_withdrawal_atomic", {
        p_withdrawal_id: withdrawalId,
        p_success: false,
        p_asaas_transfer_id: null,
        p_failure_reason: "reprovado_manual",
      });

      if (revertErr || reverted?.error) {
        return new Response(JSON.stringify({ success: false, error: reverted?.error || "Falha ao reprovar saque" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, status: "failed", withdrawalId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transferResult = await asaas("POST", "/transfers", {
      value: Number(withdrawal.net_amount),
      pixAddressKey: withdrawal.pix_key,
      pixAddressKeyType: (withdrawal.pix_key_type || "EVP").toUpperCase(),
      description: `Saque carteira TicketHall - ${withdrawal.id}`,
      externalReference: `withdrawal:${withdrawal.id}`,
    });

    if (transferResult._notConfigured) {
      return new Response(JSON.stringify({ success: false, error: "ASAAS_NOT_CONFIGURED" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (transferResult.errors || !transferResult.id) {
      const { data: reverted } = await supabaseAdmin.rpc("finalize_wallet_withdrawal_atomic", {
        p_withdrawal_id: withdrawalId,
        p_success: false,
        p_asaas_transfer_id: null,
        p_failure_reason: transferResult?.errors?.[0]?.description || "transfer_failed",
      });

      return new Response(JSON.stringify({
        success: false,
        error: reverted?.error || transferResult?.errors?.[0]?.description || "Falha na transferência",
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: finalized, error: finalizeErr } = await supabaseAdmin.rpc("finalize_wallet_withdrawal_atomic", {
      p_withdrawal_id: withdrawalId,
      p_success: true,
      p_asaas_transfer_id: transferResult.id,
      p_failure_reason: null,
    });

    if (finalizeErr || finalized?.error) {
      return new Response(JSON.stringify({ success: false, error: finalized?.error || "Falha ao finalizar saque" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      status: "paid",
      withdrawalId,
      transferId: transferResult.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("process-wallet-withdrawal error", error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
