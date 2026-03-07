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
    const { eventId } = await req.json();
    if (!eventId) throw new Error("eventId is required");

    // Auth check — must be producer or admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userData.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const callerId = userData.user.id;

    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify event ownership or admin
    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("id, title, producer_id, status")
      .eq("id", eventId)
      .single();

    if (eventErr || !event) {
      return jsonResponse({ error: "Evento não encontrado" }, 404);
    }

    // Check authorization
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: callerId, _role: "admin" });
    if (event.producer_id !== callerId && !isAdmin) {
      return jsonResponse({ error: "Sem permissão para cancelar este evento" }, 403);
    }

    if (event.status === "cancelled") {
      return jsonResponse({ error: "Evento já está cancelado" }, 400);
    }

    console.log(`Cancelling event ${eventId}: ${event.title}`);

    // 1. Get all paid orders for this event
    const { data: paidOrders } = await supabase
      .from("orders")
      .select("id, total, buyer_id, asaas_payment_id, payment_gateway")
      .eq("event_id", eventId)
      .eq("status", "paid");

    let refundedCount = 0;
    let refundedTotal = 0;

    if (paidOrders && paidOrders.length > 0) {
      const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
      const asaasBaseUrl = Deno.env.get("ASAAS_BASE_URL") || "https://sandbox.asaas.com/api/v3";

      for (const order of paidOrders) {
        // Try to refund via Asaas if configured and has payment ID
        let gatewayRefundId: string | null = null;

        if (asaasApiKey && order.asaas_payment_id) {
          try {
            const refundRes = await fetch(
              `${asaasBaseUrl}/payments/${order.asaas_payment_id}/refund`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  access_token: asaasApiKey,
                },
                body: JSON.stringify({ value: order.total }),
              }
            );
            const refundData = await refundRes.json();
            gatewayRefundId = refundData.id || null;
            console.log(`Refunded order ${order.id} via Asaas:`, refundData);
          } catch (err) {
            console.error(`Failed to refund order ${order.id} via Asaas:`, err);
          }
        }

        // Create refund record
        await supabase.from("refunds").insert({
          order_id: order.id,
          amount: order.total,
          reason: "Evento cancelado pelo organizador",
          status: gatewayRefundId ? "completed" : "pending",
          gateway_refund_id: gatewayRefundId,
          initiated_by: callerId,
        });

        // Update order status
        await supabase
          .from("orders")
          .update({
            status: "refunded",
            payment_status: "refunded",
            refunded_at: new Date().toISOString(),
            refunded_amount: order.total,
            refund_reason: "Evento cancelado",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        // Notify buyer
        await supabase.from("notifications").insert({
          user_id: order.buyer_id,
          type: "event_cancelled",
          title: "Evento cancelado",
          body: `O evento "${event.title}" foi cancelado. Seu reembolso de R$ ${Number(order.total).toFixed(2)} está sendo processado.`,
          data: { eventId, orderId: order.id },
        });

        refundedCount++;
        refundedTotal += Number(order.total);
      }
    }

    // 2. Cancel all active/reserved tickets
    await supabase
      .from("tickets")
      .update({ status: "cancelled" })
      .eq("event_id", eventId)
      .in("status", ["active", "reserved"]);

    // 3. Cancel pending orders
    await supabase
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("event_id", eventId)
      .eq("status", "pending");

    // 4. Update event status
    await supabase
      .from("events")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", eventId);

    console.log(`Event ${eventId} cancelled. ${refundedCount} orders refunded totalling R$ ${refundedTotal.toFixed(2)}`);

    return jsonResponse({
      success: true,
      message: `Evento cancelado. ${refundedCount} pedido(s) reembolsado(s) — R$ ${refundedTotal.toFixed(2)}.`,
      refundedCount,
      refundedTotal,
    });
  } catch (error) {
    console.error("cancel-event error:", error);
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
