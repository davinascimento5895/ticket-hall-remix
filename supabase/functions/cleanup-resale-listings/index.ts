// @ts-nocheck
/**
 * Cron Job: Limpar listagens de revenda expiradas
 * Deve ser executado diariamente via Supabase Cron
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verificar se é uma chamada autorizada (cron ou admin)
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const results = {
      expired: 0,
      notifications: 0,
      errors: [] as string[],
    };

    // 1. Buscar listagens expiradas
    const { data: expiredListings, error: fetchError } = await supabaseAdmin
      .from("resale_listings")
      .select("id, ticket_id, seller_id, event:event_id(title)")
      .eq("status", "active")
      .lt("expires_at", new Date().toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch expired listings: ${fetchError.message}`);
    }

    if (!expiredListings || expiredListings.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No expired listings found",
          results 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Processar cada listagem expirada
    for (const listing of expiredListings) {
      try {
        // Atualizar status da listagem
        const { error: updateListingError } = await supabaseAdmin
          .from("resale_listings")
          .update({ 
            status: "expired", 
            updated_at: new Date().toISOString() 
          })
          .eq("id", listing.id);

        if (updateListingError) {
          throw new Error(`Failed to update listing ${listing.id}: ${updateListingError.message}`);
        }

        // Liberar o ticket
        const { error: updateTicketError } = await supabaseAdmin
          .from("tickets")
          .update({
            is_for_resale: false,
            resale_price: null,
            resale_listing_id: null,
          })
          .eq("id", listing.ticket_id);

        if (updateTicketError) {
          throw new Error(`Failed to update ticket ${listing.ticket_id}: ${updateTicketError.message}`);
        }

        // Notificar vendedor
        const { error: notifError } = await supabaseAdmin
          .from("notifications")
          .insert({
            user_id: listing.seller_id,
            type: "resale_expired",
            title: "Anúncio de revenda expirado",
            message: `Seu anúncio para "${listing.event?.title || "Evento"}" expirou e o ingresso voltou para sua conta.`,
            metadata: {
              listing_id: listing.id,
              ticket_id: listing.ticket_id,
            },
          });

        if (!notifError) {
          results.notifications++;
        }

        results.expired++;

      } catch (err: any) {
        results.errors.push(`Listing ${listing.id}: ${err.message}`);
        console.error(`Error processing listing ${listing.id}:`, err);
      }
    }

    // 3. Log da execução
    console.log("Cleanup resale listings completed:", {
      timestamp: new Date().toISOString(),
      processed: expiredListings.length,
      expired: results.expired,
      notifications: results.notifications,
      errors: results.errors.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${expiredListings.length} listings`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Cleanup job error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Internal server error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
