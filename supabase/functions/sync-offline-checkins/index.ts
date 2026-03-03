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
    const { sessionId, scans } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let synced = 0;
    for (const scan of scans || []) {
      const { error } = await supabase
        .from("tickets")
        .update({
          checked_in_at: scan.checkedInAt,
          checked_in_by: scan.operatorId,
          status: "used",
          is_offline_synced: true,
        })
        .eq("id", scan.ticketId);

      if (!error) synced++;
    }

    // Clear offline scans from session
    await supabase
      .from("checkin_sessions")
      .update({ offline_scans: [], last_sync_at: new Date().toISOString() })
      .eq("id", sessionId);

    console.log("sync-offline-checkins:", { sessionId, synced });

    return new Response(
      JSON.stringify({ success: true, synced }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
