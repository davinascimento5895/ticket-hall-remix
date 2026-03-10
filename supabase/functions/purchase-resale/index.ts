import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

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
    const { listingId } = await req.json();
    if (!listingId) throw new Error("listingId is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    // C05: No fallback
    const qrSecret = Deno.env.get("QR_SECRET");
    if (!qrSecret) {
      throw new Error("QR_SECRET environment variable is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // M06: Use getUser instead of getClaims
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const buyerId = user.id;
    const buyerEmail = user.email || "";

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: listing, error: listingErr } = await supabase
      .from("resale_listings")
      .select("ticket_id, event_id")
      .eq("id", listingId)
      .eq("status", "active")
      .single();

    if (listingErr || !listing) {
      return jsonResponse({ error: "Anúncio não encontrado ou já vendido" }, 404);
    }

    const { data: ticket } = await supabase.from("tickets").select("order_id").eq("id", listing.ticket_id).single();

    const newPayload = { tid: listing.ticket_id, eid: listing.event_id, oid: ticket?.order_id, uid: buyerId, v: 2, iat: Math.floor(Date.now() / 1000) };
    const newJwt = await createJWT(newPayload, qrSecret);
    const newQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(newJwt)}`;

    const { data: result, error: rpcError } = await supabase.rpc("purchase_resale_atomic", {
      p_listing_id: listingId,
      p_buyer_id: buyerId,
      p_buyer_email: buyerEmail,
      p_new_qr_code: newJwt,
      p_new_qr_image_url: newQrImageUrl,
    });

    if (rpcError) {
      console.error("RPC error:", rpcError);
      return jsonResponse({ error: "Erro ao processar a revenda" }, 500);
    }

    if (result?.error) return jsonResponse({ error: result.error }, 400);

    console.log(`Resale completed: listing ${listingId}, buyer ${buyerId}`);

    return jsonResponse({
      success: true, message: "Ingresso adquirido com sucesso!",
      ticketId: result.ticketId, total: result.total,
      platformFee: result.platformFee, sellerReceives: result.sellerReceives,
    });
  } catch (error) {
    console.error("purchase-resale error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
