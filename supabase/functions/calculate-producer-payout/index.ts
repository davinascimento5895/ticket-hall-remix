import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // C03: Authenticate caller
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

    const { eventId, producerId } = await req.json();

    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller is the producer of this event or admin
    const { data: event } = await supabase.from("events").select("producer_id").eq("id", eventId).single();
    if (!event) {
      return new Response(JSON.stringify({ error: "Event not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: isAdmin } = await supabase.from("user_roles").select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (event.producer_id !== user.id && !isAdmin) {
      return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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

    console.log("calculate-producer-payout:", { eventId, producerId, totalRevenue, producerPayout });

    return new Response(
      JSON.stringify({ success: true, totalRevenue, platformFee: totalPlatformFee, gatewayFee: totalGatewayFee, producerPayout }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
