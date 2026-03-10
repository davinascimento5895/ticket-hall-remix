import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // C03: Only accept service role key (internal calls from other functions)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${serviceKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized — internal use only" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { ticketId, recipientEmail, eventTitle, tierName, qrCode, orderId } = await req.json();

    // EMAIL_INTEGRATION_POINT — integrate with Resend, SendGrid, or SES
    console.log("send-ticket-email stub:", { ticketId, recipientEmail, eventTitle, tierName, qrCode, orderId });

    return new Response(
      JSON.stringify({ success: true, message: "Email stub called. Integration pending." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
