import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Verify HMAC-SHA256 JWT
async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const encoder = new TextEncoder();
  const data = `${parts[0]}.${parts[1]}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  // Decode signature
  const sigB64 = parts[2].replace(/-/g, "+").replace(/_/g, "/");
  const padded = sigB64 + "=".repeat((4 - (sigB64.length % 4)) % 4);
  const sigBytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));

  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(data));
  if (!valid) return null;

  // Decode payload
  const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const payloadPadded = payloadB64 + "=".repeat((4 - (payloadB64.length % 4)) % 4);
  return JSON.parse(atob(payloadPadded));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { qrCode, checkinListId, scannedBy, deviceId } = await req.json();
    if (!qrCode) throw new Error("qrCode is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const qrSecret = Deno.env.get("QR_SECRET") || "tickethall-dev-secret-change-me";

    const supabase = createClient(supabaseUrl, serviceKey);

    // Rate limit: max 60 scans per minute per device/user
    const rlKey = `checkin:${scannedBy || deviceId || "anon"}`;
    const rlNow = new Date();
    const { data: rl } = await supabase.from("rate_limits").select("count, expires_at").eq("key", rlKey).single();
    if (rl && new Date(rl.expires_at) > rlNow && rl.count >= 60) {
      return jsonResponse({ success: false, result: "rate_limited", message: "Muitos scans. Aguarde um momento." }, 429);
    }
    if (!rl || new Date(rl.expires_at) <= rlNow) {
      await supabase.from("rate_limits").upsert({ key: rlKey, count: 1, expires_at: new Date(rlNow.getTime() + 60000).toISOString() });
    } else {
      await supabase.from("rate_limits").update({ count: rl.count + 1 }).eq("key", rlKey);
    }

    // 1. Verify JWT signature
    const payload = await verifyJWT(qrCode, qrSecret);
    if (!payload || !payload.tid) {
      await logScan(supabase, { checkinListId, qrCode, result: "invalid_qr", deviceId, scannedBy });
      return jsonResponse({ success: false, result: "invalid_qr", message: "QR code inválido ou adulterado" }, 400);
    }

    const ticketId = payload.tid as string;

    // 2. Get ticket with details
    const { data: ticket, error: ticketErr } = await supabase
      .from("tickets")
      .select("id, status, event_id, tier_id, owner_id, attendee_name, attendee_email, qr_code, ticket_tiers(name)")
      .eq("id", ticketId)
      .single();

    if (ticketErr || !ticket) {
      await logScan(supabase, { checkinListId, ticketId, qrCode, result: "not_found", deviceId, scannedBy });
      return jsonResponse({ success: false, result: "not_found", message: "Ingresso não encontrado" }, 404);
    }

    // 3. Check if QR matches (detects old QR after transfer)
    if (ticket.qr_code !== qrCode) {
      await logScan(supabase, { checkinListId, ticketId, qrCode, result: "invalid_qr", deviceId, scannedBy });
      return jsonResponse({ success: false, result: "invalid_qr", message: "QR code desatualizado (ingresso transferido)" }, 400);
    }

    // 4. Check if already used
    if (ticket.status === "used") {
      await logScan(supabase, { checkinListId, ticketId, qrCode, result: "already_used", deviceId, scannedBy });
      return jsonResponse({
        success: false,
        result: "already_used",
        message: "Ingresso já utilizado",
        attendeeName: ticket.attendee_name,
        tierName: (ticket as any).ticket_tiers?.name,
      }, 409);
    }

    // 5. Check ticket is active
    if (ticket.status !== "active") {
      await logScan(supabase, { checkinListId, ticketId, qrCode, result: "inactive", deviceId, scannedBy });
      return jsonResponse({ success: false, result: "inactive", message: `Ingresso com status: ${ticket.status}` }, 400);
    }

    // 6. Check allowed tiers if checkin list provided
    if (checkinListId) {
      const { data: list } = await supabase
        .from("checkin_lists")
        .select("allowed_tier_ids, is_active")
        .eq("id", checkinListId)
        .single();

      if (list && !list.is_active) {
        return jsonResponse({ success: false, result: "list_inactive", message: "Lista de check-in desativada" }, 400);
      }

      if (list?.allowed_tier_ids && list.allowed_tier_ids.length > 0) {
        if (!list.allowed_tier_ids.includes(ticket.tier_id)) {
          await logScan(supabase, { checkinListId, ticketId, qrCode, result: "wrong_list", deviceId, scannedBy });
          return jsonResponse({
            success: false,
            result: "wrong_list",
            message: "Ingresso não pertence a esta entrada",
            tierName: (ticket as any).ticket_tiers?.name,
          }, 403);
        }
      }
    }

    // 7. Atomically mark as used (WHERE status = 'active' prevents race conditions)
    const now = new Date().toISOString();
    const { data: updated, error: updateErr } = await supabase
      .from("tickets")
      .update({
        status: "used",
        checked_in_at: now,
        checked_in_by: scannedBy || null,
      })
      .eq("id", ticketId)
      .eq("status", "active")
      .select("id")
      .single();

    if (updateErr || !updated) {
      await logScan(supabase, { checkinListId, ticketId, qrCode, result: "race_condition", deviceId, scannedBy });
      return jsonResponse({ success: false, result: "already_used", message: "Ingresso já foi utilizado por outro operador" }, 409);
    }

    // 8. Update analytics
    await supabase.rpc("confirm_checkin_analytics", { p_event_id: ticket.event_id }).catch((err: any) => {
      console.warn("Analytics update failed:", err?.message);
    });

    // 9. Log success
    await logScan(supabase, { checkinListId, ticketId, qrCode, result: "success", deviceId, scannedBy });

    return jsonResponse({
      success: true,
      result: "success",
      message: "Check-in realizado!",
      attendeeName: ticket.attendee_name,
      attendeeEmail: ticket.attendee_email,
      tierName: (ticket as any).ticket_tiers?.name,
      checkedInAt: now,
    });
  } catch (error) {
    console.error("validate-checkin error:", error);
    return new Response(
      JSON.stringify({ success: false, result: "error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function logScan(
  supabase: any,
  params: {
    checkinListId?: string;
    ticketId?: string;
    qrCode: string;
    result: string;
    deviceId?: string;
    scannedBy?: string;
  },
) {
  try {
    await supabase.from("checkin_scan_logs").insert({
      checkin_list_id: params.checkinListId || null,
      ticket_id: params.ticketId || null,
      qr_code_scanned: params.qrCode.slice(0, 500),
      result: params.result,
      device_id: params.deviceId || null,
      scanned_by: params.scannedBy || null,
    });
  } catch (e) {
    console.error("Failed to log scan:", e);
  }
}
