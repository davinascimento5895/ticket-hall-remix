import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    let callerId: string | null = null;
    const isServiceCall = token === serviceKey;

    if (!isServiceCall) {
      const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
      if (userErr || !user) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
      callerId = user.id;
    }

    const { action, eventId } = await req.json();
    const supabase = createClient(supabaseUrl, serviceKey);

    if (action === "join") {
      if (!eventId || !callerId) throw new Error("eventId required and must be authenticated user");
      const userId = callerId; // Use authenticated user, not body param

      const { data: event } = await supabase
        .from("events")
        .select("has_virtual_queue, queue_capacity, status")
        .eq("id", eventId)
        .single();

      if (!event?.has_virtual_queue) {
        return jsonResponse({ error: "Este evento não possui fila virtual" }, 400);
      }

      const { data: existing } = await supabase
        .from("virtual_queue")
        .select("id, position, status")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .in("status", ["waiting", "admitted"])
        .single();

      if (existing) {
        return jsonResponse({ success: true, ...existing, alreadyInQueue: true });
      }

      const { count } = await supabase
        .from("virtual_queue")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .in("status", ["waiting", "admitted"]);

      const position = (count || 0) + 1;

      const { data: entry, error } = await supabase
        .from("virtual_queue")
        .insert({ event_id: eventId, user_id: userId, position, status: "waiting" })
        .select()
        .single();

      if (error) throw error;
      return jsonResponse({ success: true, ...entry });
    }

    if (action === "admit") {
      if (!eventId) throw new Error("eventId required");
      // Only producer or admin can admit
      if (callerId) {
        const { data: event } = await supabase.from("events").select("producer_id").eq("id", eventId).single();
        const { data: isAdmin } = await supabase.from("user_roles").select("id").eq("user_id", callerId).eq("role", "admin").maybeSingle();
        if ((!event || event.producer_id !== callerId) && !isAdmin) {
          return jsonResponse({ error: "Not authorized" }, 403);
        }
      }

      const batchSize = 10;
      const admissionWindow = 10 * 60 * 1000;

      const { data: waiting } = await supabase
        .from("virtual_queue")
        .select("id, user_id")
        .eq("event_id", eventId)
        .eq("status", "waiting")
        .order("position", { ascending: true })
        .limit(batchSize);

      if (!waiting || waiting.length === 0) {
        return jsonResponse({ success: true, admitted: 0 });
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + admissionWindow).toISOString();

      for (const entry of waiting) {
        await supabase.from("virtual_queue").update({
          status: "admitted", admitted_at: now.toISOString(), expires_at: expiresAt,
        }).eq("id", entry.id);

        await supabase.from("notifications").insert({
          user_id: entry.user_id, type: "queue_admitted", title: "É sua vez!",
          body: "Você foi admitido na fila. Você tem 10 minutos para completar sua compra.",
          data: { eventId },
        });
      }

      return jsonResponse({ success: true, admitted: waiting.length });
    }

    if (action === "status") {
      if (!eventId || !callerId) throw new Error("eventId required and must be authenticated");
      const userId = callerId;

      const { data: entry } = await supabase
        .from("virtual_queue")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .in("status", ["waiting", "admitted"])
        .single();

      if (!entry) return jsonResponse({ inQueue: false });

      const { count: ahead } = await supabase
        .from("virtual_queue")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "waiting")
        .lt("position", entry.position);

      return jsonResponse({
        inQueue: true, ...entry,
        peopleAhead: entry.status === "waiting" ? (ahead || 0) : 0,
      });
    }

    if (action === "expire") {
      // Only service calls or producer/admin
      if (callerId) {
        // Could be called by a cron, but if user-initiated, check admin
        const { data: isAdmin } = await supabase.from("user_roles").select("id").eq("user_id", callerId).eq("role", "admin").maybeSingle();
        if (!isAdmin) return jsonResponse({ error: "Not authorized" }, 403);
      }

      const now = new Date().toISOString();
      const { data: expired } = await supabase
        .from("virtual_queue")
        .update({ status: "expired" })
        .eq("status", "admitted")
        .lt("expires_at", now)
        .select("id");

      return jsonResponse({ success: true, expired: expired?.length || 0 });
    }

    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (error) {
    console.error("manage-queue error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
