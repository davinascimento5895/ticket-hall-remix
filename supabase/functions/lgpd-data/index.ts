import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userData.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action } = await req.json();

    // Rate limit: max 5 requests per hour per user
    const rateLimitKey = `lgpd:${userId}`;
    const { data: rl } = await supabase
      .from("rate_limits")
      .select("count, expires_at")
      .eq("key", rateLimitKey)
      .single();

    const now = new Date();
    if (rl && new Date(rl.expires_at) > now && rl.count >= 5) {
      return jsonResponse({ error: "Muitas solicitações. Tente novamente em 1 hora." }, 429);
    }

    if (!rl || new Date(rl.expires_at) <= now) {
      await supabase.from("rate_limits").upsert({
        key: rateLimitKey,
        count: 1,
        expires_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
      });
    } else {
      await supabase.from("rate_limits").update({ count: rl.count + 1 }).eq("key", rateLimitKey);
    }

    if (action === "export") {
      // Gather all user data
      const [profile, orders, tickets, consents, notifications] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("orders").select("id, event_id, total, status, payment_method, created_at").eq("buyer_id", userId),
        supabase.from("tickets").select("id, event_id, tier_id, status, attendee_name, attendee_email, created_at").eq("owner_id", userId),
        supabase.from("lgpd_consents").select("*").eq("user_id", userId),
        supabase.from("notifications").select("id, type, title, created_at, is_read").eq("user_id", userId),
      ]);

      const exportData = {
        exported_at: now.toISOString(),
        user: {
          id: userId,
          email: userEmail,
          profile: profile.data,
        },
        orders: orders.data || [],
        tickets: tickets.data || [],
        consents: consents.data || [],
        notifications: notifications.data || [],
      };

      // Log the request
      await supabase.from("lgpd_data_requests").insert({
        user_id: userId,
        request_type: "export",
        status: "completed",
        completed_at: now.toISOString(),
      });

      return jsonResponse({ success: true, data: exportData });
    }

    if (action === "delete") {
      // Create a pending deletion request for admin review
      const { data: existing } = await supabase
        .from("lgpd_data_requests")
        .select("id")
        .eq("user_id", userId)
        .eq("request_type", "deletion")
        .eq("status", "pending")
        .single();

      if (existing) {
        return jsonResponse({ error: "Já existe uma solicitação de exclusão pendente." }, 400);
      }

      await supabase.from("lgpd_data_requests").insert({
        user_id: userId,
        request_type: "deletion",
        status: "pending",
      });

      // Notify admins
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (admins) {
        await supabase.from("notifications").insert(
          admins.map((a) => ({
            user_id: a.user_id,
            type: "lgpd_deletion",
            title: "Solicitação de exclusão LGPD",
            body: `Usuário ${userEmail} solicitou exclusão de conta e dados.`,
            data: { requestUserId: userId },
          }))
        );
      }

      return jsonResponse({ success: true, message: "Solicitação de exclusão registrada. Será processada em até 15 dias." });
    }

    return jsonResponse({ error: "Ação inválida. Use 'export' ou 'delete'." }, 400);
  } catch (error) {
    console.error("lgpd-data error:", error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
