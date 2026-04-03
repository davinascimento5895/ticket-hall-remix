// @ts-nocheck
/**
 * Webhook para receber confirmações de pagamento do Asaas
 * Processa PIX e Boleto pagos de forma assíncrona
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function createJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${data}.${signatureB64}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verificar assinatura do webhook (se configurada)
    const webhookSecret = Deno.env.get("ASAAS_WEBHOOK_SECRET");
    if (webhookSecret) {
      const signature = req.headers.get("asaas-signature");
      if (!signature) {
        return new Response(JSON.stringify({ error: "Missing signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // TODO: Implementar verificação de assinatura HMAC
    }

    const body = await req.json();
    
    // O Asaas envia o evento no formato:
    // { event: "PAYMENT_RECEIVED", payment: { id, externalReference, status, ... } }
    const event = body.event;
    const payment = body.payment;

    if (!event || !payment) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Processar apenas pagamentos confirmados/recebidos
    const successEvents = ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"];
    const failureEvents = ["PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK"];
    
    if (!successEvents.includes(event) && !failureEvents.includes(event)) {
      // Evento não relevante, retornar sucesso
      return new Response(JSON.stringify({ success: true, message: "Event ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extrair resale order ID do externalReference
    // Formato: "resale:{resaleOrderId}"
    const externalRef = payment.externalReference || "";
    if (!externalRef.startsWith("resale:")) {
      // Não é uma ordem de revenda, ignorar
      return new Response(JSON.stringify({ success: true, message: "Not a resale order" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resaleOrderId = externalRef.replace("resale:", "");

    // Buscar ordem de revenda
    const { data: resaleOrder, error: orderError } = await supabaseAdmin
      .from("resale_orders")
      .select("id, buyer_id, ticket_id, event_id, buyer_email, status, asaas_payment_id")
      .eq("id", resaleOrderId)
      .single();

    if (orderError || !resaleOrder) {
      console.error("Resale order not found", { resaleOrderId, error: orderError });
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Se já estiver liquidada, ignorar
    if (resaleOrder.status === "settled") {
      return new Response(JSON.stringify({ success: true, message: "Already settled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Se foi reembolsado ou chargeback
    if (failureEvents.includes(event)) {
      await supabaseAdmin
        .from("resale_orders")
        .update({
          status: event === "PAYMENT_CHARGEBACK" ? "chargeback" : "refunded",
          asaas_payment_status: payment.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resaleOrderId);

      // Notificar comprador
      await supabaseAdmin.from("notifications").insert({
        user_id: resaleOrder.buyer_id,
        type: "resale_payment_failed",
        title: "Pagamento não confirmado",
        message: `O pagamento do seu ingresso não foi confirmado. ${event === "PAYMENT_CHARGEBACK" ? "Houve um chargeback." : "O valor foi reembolsado."}`,
        metadata: { resale_order_id: resaleOrderId },
      });

      return new Response(JSON.stringify({ success: true, message: "Payment failure processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Processar pagamento bem-sucedido
    const qrSecret = Deno.env.get("QR_SECRET");
    if (!qrSecret) {
      console.error("QR_SECRET not configured");
      return new Response(JSON.stringify({ error: "Configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gerar novo QR code para o comprador
    const payload = {
      tid: resaleOrder.ticket_id,
      eid: resaleOrder.event_id,
      uid: resaleOrder.buyer_id,
      v: 2,
      iat: Math.floor(Date.now() / 1000),
    };
    const newQr = await createJWT(payload, qrSecret);
    const newQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(newQr)}`;

    // Liquidar ordem atomicamente
    const { data: settled, error: settleError } = await supabaseAdmin.rpc("settle_resale_order_atomic", {
      p_resale_order_id: resaleOrder.id,
      p_buyer_email: resaleOrder.buyer_email,
      p_asaas_payment_id: payment.id,
      p_asaas_payment_status: payment.status,
      p_new_qr_code: newQr,
      p_new_qr_image_url: newQrImageUrl,
      p_paid_at: payment.paymentDate || new Date().toISOString(),
    });

    if (settleError || settled?.error) {
      console.error("Settlement failed", { settleError, settled });
      return new Response(JSON.stringify({ error: settled?.error || "Settlement failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Atualizar status da ordem
    await supabaseAdmin
      .from("resale_orders")
      .update({
        status: "settled",
        asaas_payment_status: payment.status,
        paid_at: payment.paymentDate || new Date().toISOString(),
        settled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", resaleOrderId);

    // Notificar comprador
    await supabaseAdmin.from("notifications").insert({
      user_id: resaleOrder.buyer_id,
      type: "resale_purchase_confirmed",
      title: "Ingresso confirmado!",
      message: "Seu pagamento foi confirmado e o ingresso está disponível em 'Meus Ingressos'.",
      metadata: { 
        resale_order_id: resaleOrderId,
        ticket_id: settled?.ticketId,
      },
    });

    console.log("Resale payment processed successfully", { 
      resaleOrderId, 
      paymentId: payment.id,
      ticketId: settled?.ticketId,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Payment processed",
      ticketId: settled?.ticketId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook error", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
