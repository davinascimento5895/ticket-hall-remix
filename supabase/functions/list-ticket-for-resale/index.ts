import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sellerId = user.id;
    const { ticketId, askingPrice, expiresAt } = await req.json();

    // Validations
    if (!ticketId || !askingPrice || askingPrice <= 0) {
      return new Response(
        JSON.stringify({ error: "ticketId and valid askingPrice are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select(`
        *,
        event:event_id (
          allow_resale,
          resale_min_price_percent,
          resale_max_price_percent,
          resale_start_date,
          resale_end_date,
          title
        ),
        tier:tier_id (
          is_resellable,
          price
        )
      `)
      .eq("id", ticketId)
      .eq("owner_id", sellerId)
      .eq("status", "active")
      .single();

    if (ticketError || !ticket) {
      return new Response(
        JSON.stringify({ error: "Ticket not found or not available for resale" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if resale is allowed for this event
    if (!ticket.event?.allow_resale) {
      return new Response(
        JSON.stringify({ error: "Resale is not allowed for this event" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if tier is resellable
    if (ticket.tier?.is_resellable === false) {
      return new Response(
        JSON.stringify({ error: "This ticket tier cannot be resold" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check price limits
    const originalPrice = ticket.tier?.price || ticket.purchase_price || 0;
    const minPricePercent = ticket.event?.resale_min_price_percent || 50;
    // Política anti-cambismo: máximo 100% do valor original por padrão
    const maxPricePercent = ticket.event?.resale_max_price_percent || 100;
    const minPrice = originalPrice * (minPricePercent / 100);
    const maxPrice = originalPrice * (maxPricePercent / 100);

    if (askingPrice < minPrice || askingPrice > maxPrice) {
      return new Response(
        JSON.stringify({ 
          error: `Price must be between ${new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
          }).format(minPrice)} and ${new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
          }).format(maxPrice)}`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check resale period
    const now = new Date();
    const resaleStart = ticket.event?.resale_start_date ? new Date(ticket.event.resale_start_date) : null;
    const resaleEnd = ticket.event?.resale_end_date ? new Date(ticket.event.resale_end_date) : null;

    if (resaleStart && now < resaleStart) {
      return new Response(
        JSON.stringify({ error: "Resale period has not started yet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (resaleEnd && now > resaleEnd) {
      return new Response(
        JSON.stringify({ error: "Resale period has ended" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already listed
    const { data: existingListing } = await supabase
      .from("resale_listings")
      .select("id")
      .eq("ticket_id", ticketId)
      .eq("status", "active")
      .single();

    if (existingListing) {
      return new Response(
        JSON.stringify({ error: "Ticket is already listed for resale" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate fees (10% platform fee)
    const platformFeePercent = 10;
    const platformFee = askingPrice * (platformFeePercent / 100);
    const sellerReceives = askingPrice - platformFee;

    // Default expiration: 30 days or event date, whichever is sooner
    const eventDate = ticket.event_date ? new Date(ticket.event_date) : null;
    const defaultExpiration = new Date();
    defaultExpiration.setDate(defaultExpiration.getDate() + 30);

    const listingExpiration = expiresAt 
      ? new Date(expiresAt)
      : eventDate && eventDate < defaultExpiration 
        ? eventDate 
        : defaultExpiration;

    // Create listing
    const { data: listing, error: listingError } = await supabase
      .from("resale_listings")
      .insert({
        ticket_id: ticketId,
        event_id: ticket.event_id,
        tier_id: ticket.tier_id,
        seller_id: sellerId,
        original_price: originalPrice,
        asking_price: askingPrice,
        platform_fee: platformFee,
        seller_receives: sellerReceives,
        status: "active",
        expires_at: listingExpiration.toISOString()
      })
      .select()
      .single();

    if (listingError) throw listingError;

    // Mark ticket as listed
    await supabase
      .from("tickets")
      .update({
        listed_for_resale: true,
        resale_listing_id: listing.id
      })
      .eq("id", ticketId);

    // Create notification
    await supabase
      .from("notifications")
      .insert({
        user_id: sellerId,
        type: "resale_listed",
        title: "Ingresso listado para revenda",
        message: `Seu ingresso para "${ticket.event?.title}" foi listado por ${new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL"
        }).format(askingPrice)}.`,
        metadata: {
          listing_id: listing.id,
          ticket_id: ticketId,
          price: askingPrice
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        listingId: listing.id,
        platformFee: platformFee,
        sellerReceives: sellerReceives,
        message: "Ticket listed for resale successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
