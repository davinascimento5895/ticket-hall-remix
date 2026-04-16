import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractTidWithoutSignature, isLegacyTicketId, isPlaceholderQr } from "../_shared/checkin-qr.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Verify HMAC-SHA256 JWT
async function verifyJWT(token: string, secret: string): Promise<{ payload: Record<string, unknown> | null; reason: string | null }> {
  const parts = token.split(".");
  if (parts.length !== 3) return { payload: null, reason: "jwt_format_invalid" };
  const encoder = new TextEncoder();
  const data = `${parts[0]}.${parts[1]}`;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const sigB64 = parts[2].replace(/-/g, "+").replace(/_/g, "/");
  const padded = sigB64 + "=".repeat((4 - (sigB64.length % 4)) % 4);
  const sigBytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(data));
  if (!valid) return { payload: null, reason: "jwt_signature_invalid" };
  const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const payloadPadded = payloadB64 + "=".repeat((4 - (payloadB64.length % 4)) % 4);
  try {
    const payload = JSON.parse(atob(payloadPadded));
    return { payload, reason: null };
  } catch {
    return { payload: null, reason: "jwt_payload_invalid" };
  }
}

function createRequestId() {
  return crypto.randomUUID();
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function fail(params: {
  requestId: string;
  phase: string;
  status: number;
  result: string;
  message: string;
  extra?: Record<string, unknown>;
}) {
  const { requestId, phase, status, result, message, extra } = params;
  console.warn("validate-checkin fail", { requestId, phase, status, result, message, ...(extra || {}) });
  return jsonResponse({ success: false, result, message, phase, requestId, ...(extra || {}) }, status);
}

serve(async (req) => {
  const requestId = createRequestId();

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const qrSecret = Deno.env.get("QR_SECRET");
    // C05: No fallback
    if (!qrSecret) {
      return fail({ requestId, phase: "config", status: 500, result: "config_error", message: "QR_SECRET not configured" });
    }

    // C03: Authenticate operator
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return fail({ requestId, phase: "auth_header", status: 401, result: "unauthorized", message: "Authentication required" });
    }

    const token = authHeader.replace("Bearer ", "");
    let operatorId: string | null = null;
    const isServiceCall = token === serviceKey;

    if (!isServiceCall) {
      const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
      if (userErr || !user) {
        return fail({ requestId, phase: "auth_user", status: 401, result: "unauthorized", message: "Invalid authentication" });
      }
      operatorId = user.id;
    }

    const { qrCode, checkinListId, scannedBy, deviceId, verificationMethod } = await req.json();
    if (!qrCode) throw new Error("qrCode is required");

    const supabase = createClient(supabaseUrl, serviceKey);

    // Use authenticated operator ID instead of body param
    const effectiveScannedBy = operatorId || scannedBy;

    // Fetch operator and list metadata for audit logging
    let operatorName: string | null = null;
    let operatorEmail: string | null = null;
    let checkinListName: string | null = null;
    if (effectiveScannedBy) {
      const { data: op } = await supabase.from("profiles").select("full_name, email").eq("id", effectiveScannedBy).maybeSingle();
      operatorName = op?.full_name || null;
      operatorEmail = op?.email || null;
    }
    if (checkinListId) {
      const { data: cl } = await supabase.from("checkin_lists").select("name").eq("id", checkinListId).maybeSingle();
      checkinListName = cl?.name || null;
    }

    // Rate limit
    const rlKey = `checkin:${effectiveScannedBy || deviceId || "anon"}`;
    const rlNow = new Date();
    const { data: rl } = await supabase.from("rate_limits").select("count, expires_at").eq("key", rlKey).single();
    if (rl && new Date(rl.expires_at) > rlNow && rl.count >= 60) {
      return fail({ requestId, phase: "rate_limit", status: 429, result: "rate_limited", message: "Muitos scans. Aguarde um momento." });
    }
    if (!rl || new Date(rl.expires_at) <= rlNow) {
      await supabase.from("rate_limits").upsert({ key: rlKey, count: 1, expires_at: new Date(rlNow.getTime() + 60000).toISOString() });
    } else {
      await supabase.from("rate_limits").update({ count: rl.count + 1 }).eq("key", rlKey);
    }

    // 1. Verify JWT signature
    const verification = await verifyJWT(qrCode, qrSecret);
    let ticketId: string | null = null;
    let legacyRawTicketId = false;

    if (verification.payload?.tid && typeof verification.payload.tid === "string") {
      ticketId = verification.payload.tid as string;
    } else {
      const extracted = extractTidWithoutSignature(qrCode);
      if (extracted.tid) {
        ticketId = extracted.tid;
      } else if (isLegacyTicketId(qrCode)) {
        ticketId = qrCode.trim();
        legacyRawTicketId = true;
      } else {
        await logScan(supabase, { checkinListId, checkinListName, qrCode, result: "invalid_qr", deviceId, scannedBy: effectiveScannedBy, operatorName, operatorEmail, verificationMethod: "qr_scan" });
        return fail({
          requestId,
          phase: "jwt_verify",
          status: 400,
          result: "invalid_qr",
          message: "QR code inválido ou adulterado",
          extra: { reason: verification.reason || extracted.reason },
        });
      }
    }

    // 2. Get ticket with details
    let { data: ticket, error: ticketErr } = await supabase
      .from("tickets")
      .select("id, status, event_id, tier_id, order_id, owner_id, attendee_name, attendee_email, qr_code, ticket_tiers(name)")
      .eq("id", ticketId)
      .single();

    // Fallback: legacy tickets created between migrations had a random UUID
    // in qr_code different from id. Allow lookup by that printed QR value.
    if ((ticketErr || !ticket) && legacyRawTicketId) {
      const fallback = await supabase
        .from("tickets")
        .select("id, status, event_id, tier_id, order_id, owner_id, attendee_name, attendee_email, qr_code, ticket_tiers(name)")
        .eq("qr_code", qrCode.trim())
        .maybeSingle();
      if (fallback.data) {
        ticket = fallback.data;
        ticketErr = null;
        ticketId = ticket.id;
      }
    }

    if (ticketErr || !ticket) {
      await logScan(supabase, { checkinListId, checkinListName, ticketId, qrCode, result: "not_found", deviceId, scannedBy: effectiveScannedBy, operatorName, operatorEmail, verificationMethod: "qr_scan" });
      return fail({ requestId, phase: "ticket_lookup", status: 404, result: "not_found", message: "Ingresso não encontrado" });
    }

    // Accept legacy raw UUID QR values used by older ticket renders.
    // Also accept ticketId fallback when the stored qr_code is a placeholder hex.
    if (!legacyRawTicketId && ticket.qr_code !== qrCode && !(isPlaceholderQr(ticket.qr_code) && qrCode === ticketId)) {
      await logScan(supabase, { checkinListId, checkinListName, ticketId, qrCode, result: "invalid_qr", deviceId, scannedBy: effectiveScannedBy, operatorName, operatorEmail, verificationMethod: "qr_scan" });
      return fail({
        requestId,
        phase: "jwt_verify",
        status: 400,
        result: "invalid_qr",
        message: "QR code inválido ou desatualizado",
        extra: { reason: verification.reason || "signature_mismatch" },
      });
    }

    // 2b. Authorize operator: must be event producer, event staff, or service call
    if (operatorId) {
      const { data: event } = await supabase
        .from("events")
        .select("producer_id")
        .eq("id", ticket.event_id)
        .single();
      const isProducer = event?.producer_id === operatorId;

      if (!isProducer) {
        const { data: staffRecord } = await supabase
          .from("event_staff")
          .select("id")
          .eq("event_id", ticket.event_id)
          .eq("user_id", operatorId)
          .maybeSingle();

        if (!staffRecord) {
          return fail({ requestId, phase: "event_permission", status: 403, result: "unauthorized", message: "Você não tem permissão para fazer check-in neste evento" });
        }
      }
    }

    // 3. Check if QR matches (detects old QR after transfer)
    // Allow fallback to ticketId when stored qr_code is a placeholder hex.
    if (ticket.qr_code !== qrCode && !(isPlaceholderQr(ticket.qr_code) && qrCode === ticketId)) {
      await logScan(supabase, { checkinListId, checkinListName, ticketId, qrCode, result: "invalid_qr", deviceId, scannedBy: effectiveScannedBy, operatorName, operatorEmail, verificationMethod: "qr_scan" });
      return fail({ requestId, phase: "ticket_qr_mismatch", status: 400, result: "invalid_qr", message: "QR code desatualizado (ingresso transferido)" });
    }

    // 3b. Critical payment guard: only allow check-in for effectively paid orders
    const { data: order } = await supabase
      .from("orders")
      .select("status, payment_status")
      .eq("id", ticket.order_id)
      .maybeSingle();

    if (!order || order.status !== "paid" || order.payment_status !== "paid") {
      await logScan(supabase, { checkinListId, checkinListName, ticketId, qrCode, result: "inactive", deviceId, scannedBy: effectiveScannedBy, operatorName, operatorEmail, verificationMethod: "qr_scan" });
      return fail({ requestId, phase: "order_payment", status: 402, result: "unpaid", message: "Ingresso com pagamento não confirmado" });
    }

    // 4. Check if already used
    if (ticket.status === "used") {
      await logScan(supabase, { checkinListId, checkinListName, ticketId, qrCode, result: "already_used", deviceId, scannedBy: effectiveScannedBy, operatorName, operatorEmail, verificationMethod: "qr_scan" });
      return jsonResponse({
        success: false, result: "already_used", message: "Ingresso já utilizado",
        attendeeName: ticket.attendee_name, tierName: (ticket as any).ticket_tiers?.name, phase: "ticket_status", requestId,
      }, 409);
    }

    // 5. Check ticket is active
    if (ticket.status !== "active") {
      await logScan(supabase, { checkinListId, checkinListName, ticketId, qrCode, result: "inactive", deviceId, scannedBy: effectiveScannedBy, operatorName, operatorEmail, verificationMethod: "qr_scan" });
      return fail({ requestId, phase: "ticket_status", status: 400, result: "inactive", message: `Ingresso com status: ${ticket.status}` });
    }

    // 6. Check allowed tiers if checkin list provided
    if (checkinListId) {
      const { data: list } = await supabase.from("checkin_lists").select("allowed_tier_ids, is_active").eq("id", checkinListId).single();
      if (list && !list.is_active) {
        return fail({ requestId, phase: "checkin_list", status: 400, result: "list_inactive", message: "Lista de check-in desativada" });
      }
      if (list?.allowed_tier_ids && list.allowed_tier_ids.length > 0) {
        if (!list.allowed_tier_ids.includes(ticket.tier_id)) {
          await logScan(supabase, { checkinListId, checkinListName, ticketId, qrCode, result: "wrong_list", deviceId, scannedBy: effectiveScannedBy, operatorName, operatorEmail, verificationMethod: "qr_scan" });
          return jsonResponse({ success: false, result: "wrong_list", message: "Ingresso não pertence a esta entrada", tierName: (ticket as any).ticket_tiers?.name, phase: "checkin_list", requestId }, 403);
        }
      }
    }

    // 7. Atomically mark as used
    const now = new Date().toISOString();
    const { data: updated, error: updateErr } = await supabase
      .from("tickets")
      .update({ status: "used", checked_in_at: now, checked_in_by: effectiveScannedBy || null })
      .eq("id", ticketId)
      .eq("status", "active")
      .select("id")
      .single();

    if (updateErr || !updated) {
      await logScan(supabase, { checkinListId, checkinListName, ticketId, qrCode, result: "race_condition", deviceId, scannedBy: effectiveScannedBy, operatorName, operatorEmail, verificationMethod: "qr_scan" });
      return fail({ requestId, phase: "update_status", status: 409, result: "already_used", message: "Ingresso já foi utilizado por outro operador" });
    }

    // 8. Update analytics
    try { await supabase.rpc("confirm_checkin_analytics", { p_event_id: ticket.event_id }); } catch {}

    // 9. Generate certificate if event has certificates enabled
    let certificateGenerated = false;
    try {
      const { data: event } = await supabase
        .from("events")
        .select("has_certificates, title, certificate_config")
        .eq("id", ticket.event_id)
        .single();
      
      if (event?.has_certificates) {
        // Check if participant opted out
        const { data: participantPref } = await supabase
          .from("participant_certificate_prefs")
          .select("opt_out")
          .eq("event_id", ticket.event_id)
          .eq("user_id", ticket.owner_id)
          .maybeSingle();
        
        if (participantPref?.opt_out) {
          console.log(`Participant ${ticket.owner_id} opted out of certificate`);
        } else {
          // Check if certificate already exists
          const { data: existingCert } = await supabase
            .from("certificates")
            .select("id")
            .eq("ticket_id", ticketId)
            .maybeSingle();
          
          if (!existingCert) {
            const certCode = `CERT-${ticket.event_id.slice(0, 4).toUpperCase()}-${ticketId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
            const attendeeName = ticket.attendee_name || "Participante";
            
            // Get workload from config
            const config = event.certificate_config || {};
            const workloadHours = config.showWorkload ? (config.workloadHours || 0) : null;
            
            const { error: certError } = await supabase
              .from("certificates")
              .insert({
                event_id: ticket.event_id,
                ticket_id: ticketId,
                user_id: ticket.owner_id,
                certificate_code: certCode,
                attendee_name: attendeeName,
                issued_at: now,
                workload_hours: workloadHours,
              });
            
            if (!certError) {
              certificateGenerated = true;
              // Send notification to user
              try {
                await supabase.from("notifications").insert({
                  user_id: ticket.owner_id,
                  type: "certificate_issued",
                  title: "Certificado disponível!",
                  body: `Seu certificado de participação em "${event.title}" está disponível em Meus Certificados.`,
                  data: { eventId: ticket.event_id },
                });
              } catch (notifErr) {
                console.error("Failed to send certificate notification:", notifErr);
              }
            }
          }
        }
      }
    } catch (certErr) {
      console.error("Failed to generate certificate:", certErr);
      // Don't fail the check-in if certificate generation fails
    }

    // 10. Log success
    await logScan(supabase, { checkinListId, checkinListName, ticketId, qrCode, result: "success", deviceId, scannedBy: effectiveScannedBy, operatorName, operatorEmail, verificationMethod: verificationMethod || "qr_scan" });

    return jsonResponse({
      success: true, result: "success", message: "Check-in realizado!",
      attendeeName: ticket.attendee_name, attendeeEmail: ticket.attendee_email,
      tierName: (ticket as any).ticket_tiers?.name, checkedInAt: now,
      certificateGenerated, phase: "done", requestId,
    });
  } catch (error) {
    console.error("validate-checkin error:", { requestId, error: String(error) });
    return new Response(
      JSON.stringify({ success: false, result: "error", message: (error as Error).message, phase: "exception", requestId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

async function logScan(supabase: any, params: { checkinListId?: string; checkinListName?: string | null; ticketId?: string; qrCode: string; result: string; deviceId?: string; scannedBy?: string; operatorName?: string | null; operatorEmail?: string | null; verificationMethod?: string }) {
  try {
    await supabase.from("checkin_scan_logs").insert({
      checkin_list_id: params.checkinListId || null,
      checkin_list_name: params.checkinListName || null,
      ticket_id: params.ticketId || null,
      qr_code_scanned: params.qrCode.slice(0, 500),
      result: params.result,
      device_id: params.deviceId || null,
      scanned_by: params.scannedBy || null,
      operator_name: params.operatorName || null,
      operator_email: params.operatorEmail || null,
      verification_method: params.verificationMethod || "qr_scan",
    });
  } catch (e) { console.error("Failed to log scan:", e); }
}
