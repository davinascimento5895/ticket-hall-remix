import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function createJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${data}.${sigB64}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId } = await req.json();
    if (!ticketId) throw new Error("ticketId is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const qrSecret = Deno.env.get("QR_SECRET");
    // C05: No fallback — fail if not configured
    if (!qrSecret) {
      throw new Error("QR_SECRET environment variable is not configured");
    }

    // C03: Authenticate caller — accept service role key (internal) or user JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = authHeader.replace("Bearer ", "");
    let callerId: string | null = null;
    const isServiceCall = token === serviceKey;

    if (!isServiceCall) {
      const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
      if (userErr || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      callerId = user.id;
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Get ticket details
    const { data: ticket, error: ticketErr } = await supabase
      .from("tickets")
      .select("id, event_id, order_id, tier_id, owner_id")
      .eq("id", ticketId)
      .single();

    if (ticketErr || !ticket) throw new Error("Ticket not found");

    // If not service call, verify caller owns the ticket or is event producer
    if (callerId) {
      if (ticket.owner_id !== callerId) {
        const { data: event } = await supabase.from("events").select("producer_id").eq("id", ticket.event_id).single();
        if (!event || event.producer_id !== callerId) {
          return new Response(JSON.stringify({ error: "Not authorized for this ticket" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    }

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
      .update({ qr_code: jwt, qr_code_image_url: qrImageUrl })
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
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
