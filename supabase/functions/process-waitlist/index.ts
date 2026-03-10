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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // C03: Only accept service role key (internal/cron calls)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${serviceKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized — internal use only" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { eventId, tierId } = await req.json();

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);

    const { data: entries, error } = await supabase
      .from("waitlist")
      .select("*")
      .eq("event_id", eventId)
      .eq("status", "waiting")
      .order("position", { ascending: true })
      .limit(10);

    if (error) throw error;

    // NOTIFICATION_INTEGRATION_POINT — notify users about availability
    console.log("process-waitlist:", { eventId, tierId, entriesCount: entries?.length });

    return new Response(
      JSON.stringify({ success: true, processed: entries?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
