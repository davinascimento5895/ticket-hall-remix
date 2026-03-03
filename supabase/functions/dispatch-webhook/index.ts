import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hmacSign(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { webhook_id, event_type, payload } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get webhook config
    const { data: webhook, error: whError } = await supabase
      .from("webhooks")
      .select("*")
      .eq("id", webhook_id)
      .eq("is_active", true)
      .single();

    if (whError || !webhook) {
      return new Response(
        JSON.stringify({ error: "Webhook not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if event type is subscribed
    if (!webhook.events.includes(event_type)) {
      return new Response(
        JSON.stringify({ error: "Event type not subscribed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payloadStr = JSON.stringify(payload);
    const signature = await hmacSign(webhook.secret, payloadStr);
    const timestamp = new Date().toISOString();

    // Create delivery record
    const { data: delivery, error: delError } = await supabase
      .from("webhook_deliveries")
      .insert({
        webhook_id: webhook.id,
        event_type,
        payload,
        attempts: 1,
      })
      .select()
      .single();

    let responseStatus = null;
    let responseBody = null;

    // Attempt delivery with retry
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

      // Exponential backoff before retry
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }

    // Update delivery record
    if (delivery) {
      await supabase
        .from("webhook_deliveries")
        .update({
          response_status: responseStatus,
          response_body: responseBody?.slice(0, 1000),
          delivered_at: responseStatus && responseStatus < 300 ? new Date().toISOString() : null,
          attempts: 3,
        })
        .eq("id", delivery.id);
    }

    // Update webhook last_triggered_at
    await supabase
      .from("webhooks")
      .update({ last_triggered_at: new Date().toISOString() })
      .eq("id", webhook.id);

    console.log("dispatch-webhook:", { webhook_id, event_type, status: responseStatus });

    return new Response(
      JSON.stringify({ success: true, status: responseStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
