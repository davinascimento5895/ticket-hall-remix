import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * ⚠️ EDGE FUNCTION DEPRECIADA
 * 
 * Esta edge function foi descontinuada por questões de segurança.
 * O fluxo de compra de revenda agora deve usar:
 * 1. POST /functions/v1/create-resale-payment (cria ordem de pagamento)
 * 2. Webhook /functions/v1/resale-payment-webhook (confirma pagamento)
 * 
 * Motivo: Esta função processava a compra diretamente sem validação
 * de pagamento, permitindo bypass do gateway financeiro.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      error: "Método depreciado",
      message: "Este endpoint não está mais disponível. Use o checkout oficial de revenda.",
      redirect: "/revenda",
      code: "DEPRECATED_ENDPOINT"
    }),
    { 
      status: 410, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
});
