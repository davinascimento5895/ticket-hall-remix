import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple HMAC-SHA256 JWT implementation for Deno
async function createJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const encoder = new TextEncoder();

  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${data}.${sigB64}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId, orderId } = await req.json();
    if (!ticketId) throw new Error("ticketId is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const qrSecret = Deno.env.get("QR_SECRET") || "tickethall-dev-secret-change-me";

    const supabase = createClient(supabaseUrl, serviceKey);

    // Get ticket details
    const { data: ticket, error: ticketErr } = await supabase
      .from("tickets")
      .select("id, event_id, order_id, tier_id, owner_id")
      .eq("id", ticketId)
      .single();

    if (ticketErr || !ticket) throw new Error("Ticket not found");

    // Create signed JWT payload
    const payload = {
      tid: ticket.id,
      eid: ticket.event_id,
      oid: ticket.order_id,
      uid: ticket.owner_id,
      v: 1,
      iat: Math.floor(Date.now() / 1000),
    };

    const jwt = await createJWT(payload, qrSecret);

    // Generate QR code image via public API
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(jwt)}`;

    // Update ticket with QR code and image URL
    const { error: updateErr } = await supabase
      .from("tickets")
      .update({
        qr_code: jwt,
        qr_code_image_url: qrImageUrl,
      })
      .eq("id", ticketId);

    if (updateErr) throw updateErr;

    console.log("generate-qr-code: JWT created for ticket", ticketId);

    return new Response(
      JSON.stringify({ success: true, qrCode: jwt, imageUrl: qrImageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("generate-qr-code error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
