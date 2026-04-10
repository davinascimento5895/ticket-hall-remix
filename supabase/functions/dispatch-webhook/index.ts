import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// A04: SSRF protection — block private IPs
function isPrivateUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname.toLowerCase();
    // Block non-HTTPS
    if (url.protocol !== "https:") return true;
    // Block private/reserved hostnames
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") return true;
    if (hostname === "metadata.google.internal" || hostname === "169.254.169.254") return true;
    if (hostname.endsWith(".internal") || hostname.endsWith(".local")) return true;
    // Block private IP ranges
    const parts = hostname.split(".").map(Number);
    if (parts.length === 4 && parts.every(p => !isNaN(p))) {
      if (parts[0] === 10) return true;
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
      if (parts[0] === 192 && parts[1] === 168) return true;
      if (parts[0] === 169 && parts[1] === 254) return true;
    }
    return false;
  } catch {
    return true;
  }
}

async function hmacSign(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");
}

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

    const token = authHeader.replace("Bearer ", "");
    let callerId: string | null = null;
    const isServiceCall = token === serviceKey;

    if (!isServiceCall) {
      const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
      if (userErr || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      callerId = user.id;
    }

    const { webhook_id, event_type, payload } = await req.json();

    const supabase = createClient(supabaseUrl, serviceKey);

    // Get webhook config
    const { data: webhook, error: whError } = await supabase
      .from("webhooks")
      .select("*")
      .eq("id", webhook_id)
      .eq("is_active", true)
      .single();

    if (whError || !webhook) {
      return new Response(JSON.stringify({ error: "Webhook not found or inactive" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify caller is the webhook's producer (if not service call)
    if (callerId) {
      const { data: event } = await supabase.from("events").select("producer_id").eq("id", webhook.event_id).single();
      const { data: isAdmin } = await supabase.from("user_roles").select("id").eq("user_id", callerId).eq("role", "admin").maybeSingle();
      if ((!event || event.producer_id !== callerId) && !isAdmin) {
        return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // A04: SSRF protection
    if (isPrivateUrl(webhook.url)) {
      return new Response(JSON.stringify({ error: "Webhook URL is not allowed (private/internal address)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!webhook.events.includes(event_type)) {
      return new Response(JSON.stringify({ error: "Event type not subscribed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const payloadStr = JSON.stringify(payload);
    const signature = await hmacSign(webhook.secret, payloadStr);
    const timestamp = new Date().toISOString();

    const { data: delivery } = await supabase
      .from("webhook_deliveries")
      .insert({ webhook_id: webhook.id, event_type, payload, attempts: 1 })
      .select()
      .single();

    let responseStatus = null;
    let responseBody = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-TicketHall-Signature": signature,
            "X-TicketHall-Timestamp": timestamp,
            "X-TicketHall-Event": event_type,
          },
          body: payloadStr,
        });
        responseStatus = res.status;
        responseBody = await res.text();
        if (res.ok) break;
      } catch (fetchError) {
        responseStatus = 0;
        responseBody = String(fetchError);
      }
      if (attempt < 2) await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }

    if (delivery) {
      await supabase.from("webhook_deliveries").update({
        response_status: responseStatus,
        response_body: responseBody?.slice(0, 1000),
        delivered_at: responseStatus && responseStatus < 300 ? new Date().toISOString() : null,
        attempts: 3,
      }).eq("id", delivery.id);
    }

    await supabase.from("webhooks").update({ last_triggered_at: new Date().toISOString() }).eq("id", webhook.id);

    console.log("dispatch-webhook:", { webhook_id, event_type, status: responseStatus });

    return new Response(
      JSON.stringify({ success: true, status: responseStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
