import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // Validate webhook authentication
    const webhookToken = req.headers.get("asaas-access-token");
    const expectedToken = Deno.env.get("ASAAS_API_KEY");

    // If Asaas is configured, validate the token
    if (expectedToken && webhookToken !== expectedToken) {
      console.error("Invalid webhook token");
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { event, payment } = body;

    if (!event || !payment) {
      return new Response("Invalid payload", { status: 400, headers: corsHeaders });
    }

    console.log(`asaas-webhook received: ${event} for payment ${payment.id}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const orderId = payment.externalReference;
    if (!orderId) {
      console.error("No externalReference in payment");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Verify the order exists
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, status, event_id")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      console.error("Order not found:", orderId);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    switch (event) {
      case "PAYMENT_RECEIVED":
      case "PAYMENT_CONFIRMED": {
        // Only process if not already paid
        if (order.status === "paid") {
          console.log("Order already paid, skipping:", orderId);
          break;
        }

        // Atomic payment confirmation
        const { data: confirmed } = await supabase.rpc("confirm_order_payment", {
          p_order_id: orderId,
          p_asaas_payment: payment.id,
          p_net_value: payment.netValue || payment.value,
        });

        if (confirmed) {
          console.log("Payment confirmed for order:", orderId);

          // Trigger async: generate QR codes for tickets
          try {
            const { data: tickets } = await supabase
              .from("tickets")
              .select("id")
              .eq("order_id", orderId)
              .eq("status", "active");

            if (tickets) {
              for (const ticket of tickets) {
                await fetch(
                  `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-qr-code`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                    },
                    body: JSON.stringify({ ticketId: ticket.id }),
                  }
                ).then((r) => r.text());
              }
            }
          } catch (err) {
            console.error("Error triggering QR generation:", err);
          }

          // Trigger async: send ticket email
          try {
            await fetch(
              `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-ticket-email`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                },
                body: JSON.stringify({ orderId }),
              }
            ).then((r) => r.text());
          } catch (err) {
            console.error("Error triggering email:", err);
          }
        }
        break;
      }

      case "PAYMENT_REFUNDED": {
        await supabase
          .from("orders")
          .update({
            status: "refunded",
            payment_status: "refunded",
            refunded_at: new Date().toISOString(),
            refunded_amount: payment.value,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        // Cancel associated tickets
        await supabase
          .from("tickets")
          .update({ status: "cancelled" })
          .eq("order_id", orderId)
          .in("status", ["active", "reserved"]);

        console.log("Payment refunded for order:", orderId);
        break;
      }

      case "CHARGEBACK_REQUESTED": {
        await supabase
          .from("orders")
          .update({
            status: "chargeback",
            chargeback_status: "notified",
            chargeback_reason: payment.chargeback?.reason || "chargeback_requested",
            chargeback_notified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        // Suspend all tickets for this order
        await supabase
          .from("tickets")
          .update({ status: "suspended" })
          .eq("order_id", orderId)
          .eq("status", "active");

        // Create notification for admin
        // (Find admin users)
        const { data: admins } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");

        if (admins) {
          const notifications = admins.map((a) => ({
            user_id: a.user_id,
            type: "chargeback",
            title: "Chargeback recebido",
            body: `Pedido ${orderId.slice(0, 8)} recebeu um chargeback. Tickets suspensos.`,
            data: { orderId, eventId: order.event_id },
          }));
          await supabase.from("notifications").insert(notifications);
        }

        console.log("Chargeback processed for order:", orderId);
        break;
      }

      case "PAYMENT_REPROVED_BY_RISK_ANALYSIS": {
        await supabase
          .from("orders")
          .update({
            status: "cancelled",
            payment_status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        // Release reserved tickets
        const { data: cancelledTickets } = await supabase
          .from("tickets")
          .select("tier_id")
          .eq("order_id", orderId)
          .eq("status", "reserved");

        if (cancelledTickets && cancelledTickets.length > 0) {
          await supabase
            .from("tickets")
            .update({ status: "cancelled" })
            .eq("order_id", orderId)
            .eq("status", "reserved");

          // Decrement reserved counts
          const tierCounts: Record<string, number> = {};
          for (const t of cancelledTickets) {
            tierCounts[t.tier_id] = (tierCounts[t.tier_id] || 0) + 1;
          }
          for (const [tierId, cnt] of Object.entries(tierCounts)) {
            const { data: tier } = await supabase
              .from("ticket_tiers")
              .select("quantity_reserved")
              .eq("id", tierId)
              .single();
            if (tier) {
              await supabase
                .from("ticket_tiers")
                .update({
                  quantity_reserved: Math.max(0, (tier.quantity_reserved || 0) - cnt),
                })
                .eq("id", tierId);
            }
          }
        }

        console.log("Payment reproved by risk analysis for order:", orderId);
        break;
      }

      default:
        console.log("Unhandled webhook event:", event);
    }

    // Always return 200 quickly to avoid Asaas retries
    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("asaas-webhook error:", error);
    // Still return 200 to prevent infinite retries
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
