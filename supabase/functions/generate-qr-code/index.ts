import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId, data } = await req.json();

    // QR_CODE_INTEGRATION_POINT — use a QR generation library
    const qrCode = `TICKETHALL-${ticketId}-${Date.now()}`;

    console.log("generate-qr-code stub:", { ticketId, data, qrCode });

    return new Response(
      JSON.stringify({ success: true, qrCode, imageUrl: null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
