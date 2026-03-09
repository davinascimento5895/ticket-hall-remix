import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLATFORM_FEE_PERCENT = 0.10; // 10%

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

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { listingId } = await req.json();
    if (!listingId) throw new Error("listingId is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const qrSecret = Deno.env.get("QR_SECRET") || "tickethall-dev-secret-change-me";

    // Validate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await supabaseAuth.auth.getUser();
    if (claimsErr || !claims.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const buyerId = claims.user.id;
    const buyerEmail = claims.user.email || "";

    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Get the listing with lock
    const { data: listing, error: listingErr } = await supabase
      .from("resale_listings")
      .select("*, events(title, start_date, end_date), ticket_tiers(name)")
      .eq("id", listingId)
      .eq("status", "active")
      .single();

    if (listingErr || !listing) {
      return jsonResponse({ error: "Anúncio não encontrado ou já vendido" }, 404);
    }

    // 2. Can't buy your own listing
    if (listing.seller_id === buyerId) {
      return jsonResponse({ error: "Você não pode comprar seu próprio ingresso" }, 400);
    }

    // 3. Check if listing expired
    if (new Date(listing.expires_at) < new Date()) {
      // Auto-expire
      await supabase.from("resale_listings").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", listingId);
      await supabase.from("tickets").update({ is_for_resale: false }).eq("id", listing.ticket_id);
      return jsonResponse({ error: "Este anúncio expirou" }, 400);
    }

    // 4. Check event hasn't started
    if (listing.events?.start_date && new Date(listing.events.start_date) < new Date()) {
      await supabase.from("resale_listings").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", listingId);
      await supabase.from("tickets").update({ is_for_resale: false }).eq("id", listing.ticket_id);
      return jsonResponse({ error: "O evento já começou" }, 400);
    }

    // 5. Calculate amounts
    const askingPrice = Number(listing.asking_price);
    const platformFee = Math.round(askingPrice * PLATFORM_FEE_PERCENT * 100) / 100;
    const sellerReceives = Math.round((askingPrice - platformFee) * 100) / 100;
    const buyerTotal = askingPrice; // Buyer pays asking price; fee comes from seller's cut

    // 6. Get the ticket
    const { data: ticket, error: ticketErr } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", listing.ticket_id)
      .eq("status", "active")
      .single();

    if (ticketErr || !ticket) {
      return jsonResponse({ error: "Ingresso não está mais disponível" }, 400);
    }

    // 7. Generate new QR code for buyer (invalidates old one)
    const newPayload = {
      tid: ticket.id,
      eid: ticket.event_id,
      oid: ticket.order_id,
      uid: buyerId,
      v: 2, // version 2 = resale
      iat: Math.floor(Date.now() / 1000),
    };
    const newJwt = await createJWT(newPayload, qrSecret);
    const newQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(newJwt)}`;

    // 8. Build transfer history
    const existingHistory = Array.isArray(ticket.transfer_history) ? ticket.transfer_history : [];
    const transferEntry = {
      type: "resale",
      from: listing.seller_id,
      to: buyerId,
      at: new Date().toISOString(),
      price: askingPrice,
      platformFee,
    };

    // 9. Atomically update everything
    // Update ticket ownership
    const { error: ticketUpdateErr } = await supabase
      .from("tickets")
      .update({
        owner_id: buyerId,
        qr_code: newJwt,
        qr_code_image_url: newQrImageUrl,
        transfer_history: [...existingHistory, transferEntry],
        attendee_name: null,
        attendee_email: buyerEmail,
        attendee_cpf: null,
        is_for_resale: false,
        resale_price: null,
      })
      .eq("id", ticket.id)
      .eq("status", "active");

    if (ticketUpdateErr) {
      console.error("Ticket update error:", ticketUpdateErr);
      return jsonResponse({ error: "Erro ao processar a revenda" }, 500);
    }

    // Update listing to sold
    const { error: listingUpdateErr } = await supabase
      .from("resale_listings")
      .update({
        status: "sold",
        buyer_id: buyerId,
        sold_at: new Date().toISOString(),
        platform_fee_amount: platformFee,
        seller_receives: sellerReceives,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId)
      .eq("status", "active");

    if (listingUpdateErr) {
      console.error("Listing update error:", listingUpdateErr);
      // Try to revert ticket
      await supabase.from("tickets").update({
        owner_id: listing.seller_id,
        qr_code: ticket.qr_code,
        qr_code_image_url: ticket.qr_code_image_url,
        transfer_history: existingHistory,
        is_for_resale: true,
        resale_price: askingPrice,
      }).eq("id", ticket.id);
      return jsonResponse({ error: "Erro ao finalizar a venda" }, 500);
    }

    // 10. Create notifications
    const eventTitle = listing.events?.title || "Evento";
    const tierName = listing.ticket_tiers?.name || "Ingresso";

    await supabase.from("notifications").insert([
      {
        user_id: listing.seller_id,
        type: "resale_sold",
        title: "Ingresso vendido!",
        body: `Seu ingresso "${tierName}" para ${eventTitle} foi vendido por R$ ${askingPrice.toFixed(2)}. Você receberá R$ ${sellerReceives.toFixed(2)} (taxa de 10%).`,
        data: { listingId, ticketId: ticket.id, amount: sellerReceives },
      },
      {
        user_id: buyerId,
        type: "resale_purchased",
        title: "Ingresso adquirido!",
        body: `Você comprou um ingresso "${tierName}" para ${eventTitle} por R$ ${askingPrice.toFixed(2)}. Acesse em "Meus Ingressos".`,
        data: { listingId, ticketId: ticket.id },
      },
    ]);

    console.log(`Resale completed: listing ${listingId}, ticket ${ticket.id}, seller ${listing.seller_id} -> buyer ${buyerId}`);

    return jsonResponse({
      success: true,
      message: "Ingresso adquirido com sucesso!",
      ticketId: ticket.id,
      total: buyerTotal,
      platformFee,
      sellerReceives,
    });
  } catch (error) {
    console.error("purchase-resale error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
