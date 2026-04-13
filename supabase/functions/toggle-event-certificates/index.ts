import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    let userId: string | null = null;
    const isServiceCall = token === serviceKey;

    if (!isServiceCall) {
      const supabaseAuth = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
      if (userErr || !user) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
      userId = user.id;
    }

    const { eventId, enabled = true } = await req.json();
    if (!eventId) {
      return jsonResponse({ error: "eventId is required" }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller is the event producer (unless service call)
    if (userId) {
      const { data: event } = await supabase
        .from("events")
        .select("producer_id")
        .eq("id", eventId)
        .single();

      if (!event) {
        return jsonResponse({ error: "Event not found" }, 404);
      }

      if (event.producer_id !== userId) {
        return jsonResponse({ error: "Not authorized" }, 403);
      }
    }

    // Update has_certificates using service role (bypasses RLS)
    const { data, error } = await supabase
      .from("events")
      .update({ has_certificates: enabled })
      .eq("id", eventId)
      .select("id, has_certificates")
      .single();

    if (error) {
      return jsonResponse({ error: "Failed to update event", message: error.message }, 500);
    }

    if (!data) {
      return jsonResponse({ error: "No rows updated" }, 500);
    }

    return jsonResponse({ success: true, event: data });
  } catch (error) {
    console.error("toggle-event-certificates error:", error);
    return jsonResponse({
      error: "Request failed",
      message: (error as Error).message,
    }, 500);
  }
});
