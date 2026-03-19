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
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const sigB64 = parts[2].replace(/-/g, "+").replace(/_/g, "/");
  const padded = sigB64 + "=".repeat((4 - (sigB64.length % 4)) % 4);
  const sigBytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(data));
  if (!valid) return null;
  const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const payloadPadded = payloadB64 + "=".repeat((4 - (payloadB64.length % 4)) % 4);
  return JSON.parse(atob(payloadPadded));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const qrSecret = Deno.env.get("QR_SECRET");
    if (!qrSecret) {
      return new Response(JSON.stringify({ error: "QR_SECRET not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // C03: Authenticate operator via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { sessionId, scans } = await req.json();

    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify operator owns this session
    const { data: session } = await supabase
      .from("checkin_sessions")
      .select("operator_id, event_id")
      .eq("id", sessionId)
      .single();

    if (!session || session.operator_id !== user.id) {
      return new Response(JSON.stringify({ error: "Not authorized for this session" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let synced = 0;
    for (const scan of scans || []) {
      // C04: Validate QR code signature before marking as used
      if (!scan.qrCode) continue;
      const payload = await verifyJWT(scan.qrCode, qrSecret);
      if (!payload || !payload.tid) continue;

      const ticketId = payload.tid as string;

      // Verify ticket belongs to this event
      const { data: ticket } = await supabase
        .from("tickets")
        .select("id, event_id, order_id, qr_code, status")
        .eq("id", ticketId)
        .single();

      if (!ticket || ticket.event_id !== session.event_id) continue;
      if (ticket.qr_code !== scan.qrCode) continue; // QR was invalidated (transfer)
      if (ticket.status !== "active") continue;

      const { data: order } = await supabase
        .from("orders")
        .select("status, payment_status")
        .eq("id", ticket.order_id)
        .maybeSingle();

      if (!order || order.status !== "paid" || order.payment_status !== "paid") continue;

      const { error } = await supabase
        .from("tickets")
        .update({
          checked_in_at: scan.checkedInAt,
          checked_in_by: user.id,
          status: "used",
        })
        .eq("id", ticketId)
        .eq("status", "active"); // Atomic check

      if (!error) synced++;
    }

    // Clear offline scans from session
    await supabase
      .from("checkin_sessions")
      .update({ offline_scans: [], last_sync_at: new Date().toISOString() })
      .eq("id", sessionId);

    console.log("sync-offline-checkins:", { sessionId, synced });

    return new Response(
      JSON.stringify({ success: true, synced }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
