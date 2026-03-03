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
    const { eventId, tierId } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get next waitlist entries
    const { data: entries, error } = await supabase
      .from("waitlist")
      .select("*")
      .eq("event_id", eventId)
      .eq("status", "waiting")
      .order("position", { ascending: true })
      .limit(10);

    if (error) throw error;

    // NOTIFICATION_INTEGRATION_POINT — notify users about availability
    console.log("process-waitlist stub:", { eventId, tierId, entriesCount: entries?.length });

    return new Response(
      JSON.stringify({ success: true, processed: entries?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
