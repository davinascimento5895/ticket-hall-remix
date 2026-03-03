import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId, producerId } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Calculate totals from paid orders
    const { data: orders, error } = await supabase
      .from("orders")
      .select("subtotal, platform_fee, payment_gateway_fee, total")
      .eq("event_id", eventId)
      .eq("status", "paid");

    if (error) throw error;

    const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
    const totalPlatformFee = orders?.reduce((sum, o) => sum + Number(o.platform_fee), 0) || 0;
    const totalGatewayFee = orders?.reduce((sum, o) => sum + Number(o.payment_gateway_fee || 0), 0) || 0;
    const producerPayout = totalRevenue - totalPlatformFee - totalGatewayFee;

    // PAYOUT_INTEGRATION_POINT — trigger bank transfer via Pagar.me / Stripe Connect
    console.log("calculate-producer-payout:", { eventId, producerId, totalRevenue, producerPayout });

    return new Response(
      JSON.stringify({
        success: true,
        totalRevenue,
        platformFee: totalPlatformFee,
        gatewayFee: totalGatewayFee,
        producerPayout,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
