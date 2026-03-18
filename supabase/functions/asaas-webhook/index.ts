import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function registerWebhookEvent(supabase: any, event: string, payment: any, externalReference: string) {
  const payload = {
    event,
    paymentId: payment?.id,
    paymentStatus: payment?.status,
    externalReference,
  };

  const { data, error } = await supabase.rpc("register_payment_webhook_event", {
    p_provider: "asaas",
    p_payment_id: String(payment?.id || ""),
    p_event_type: String(event || ""),
    p_external_reference: externalReference,
    p_payload: payload,
  });

  if (error || data?.error) {
    return { ok: false as const, error: data?.error || error?.message || "register_webhook_event_failed" };
  }

  return {
    ok: true as const,
    eventId: data?.eventId as string,
    shouldProcess: Boolean(data?.shouldProcess),
    status: data?.status as string,
    attemptCount: Number(data?.attemptCount || 1),
  };
}

async function markWebhookProcessed(supabase: any, eventId: string) {
  await supabase.rpc("mark_payment_webhook_event_processed", { p_event_id: eventId });
}

async function markWebhookFailed(supabase: any, eventId: string, reason: string) {
  await supabase.rpc("mark_payment_webhook_event_failed", {
    p_event_id: eventId,
    p_failure_reason: reason,
  });
}

/** Cancel reserved tickets for an order and release quantity_reserved atomically */
async function releaseReservedTickets(supabase: any, orderId: string) {
  const { data: reservedTickets } = await supabase
    .from("tickets")
    .select("id, tier_id")
    .eq("order_id", orderId)
    .eq("status", "reserved");

  if (reservedTickets?.length) {
    await supabase.from("tickets")
      .update({ status: "cancelled" })
      .eq("order_id", orderId)
      .eq("status", "reserved");

    const tierCounts: Record<string, number> = {};
    for (const t of reservedTickets) {
      tierCounts[t.tier_id] = (tierCounts[t.tier_id] || 0) + 1;
    }
    for (const [tierId, cnt] of Object.entries(tierCounts)) {
      const { data: tier } = await supabase
        .from("ticket_tiers")
        .select("quantity_reserved")
        .eq("id", tierId)
        .single();
      if (tier) {
        await supabase.from("ticket_tiers")
          .update({ quantity_reserved: Math.max(0, (tier.quantity_reserved || 0) - cnt) })
          .eq("id", tierId);
      }
    }
  }
}

async function createJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${data}.${sigB64}`;
}

async function handleResaleWebhook(supabase: any, event: string, payment: any, resaleOrderId: string): Promise<boolean> {
  const { data: resaleOrder } = await supabase
    .from("resale_orders")
    .select("id, listing_id, status, buyer_id, event_id, ticket_id")
    .eq("id", resaleOrderId)
    .maybeSingle();

  if (!resaleOrder) {
    console.error("Resale order not found:", resaleOrderId);
    return false;
  }

  switch (event) {
    case "PAYMENT_RECEIVED":
    case "PAYMENT_CONFIRMED": {
      if (resaleOrder.status === "settled") {
        console.log("Resale order already settled, skipping:", resaleOrderId);
        break;
      }

      const qrSecret = Deno.env.get("QR_SECRET");
      if (!qrSecret) {
        console.error("QR_SECRET not configured; cannot settle resale order", resaleOrderId);
        return false;
      }

      const { data: buyerProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", resaleOrder.buyer_id)
        .maybeSingle();

      const { data: buyerAuth } = await supabase.auth.admin.getUserById(resaleOrder.buyer_id);
      const buyerEmail = buyerAuth?.user?.email || "";

      const { data: ticket } = await supabase
        .from("tickets")
        .select("id, order_id")
        .eq("id", resaleOrder.ticket_id)
        .maybeSingle();

      if (!buyerProfile || !ticket) {
        console.error("Missing data for resale settlement", { resaleOrderId, hasBuyer: !!buyerProfile, hasTicket: !!ticket });
        return false;
      }

      const payload = {
        tid: resaleOrder.ticket_id,
        eid: resaleOrder.event_id,
        oid: ticket.order_id,
        uid: resaleOrder.buyer_id,
        v: 2,
        iat: Math.floor(Date.now() / 1000),
      };
      const newQr = await createJWT(payload, qrSecret);
      const newQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(newQr)}`;

      const { data: settled, error: settleErr } = await supabase.rpc("settle_resale_order_atomic", {
        p_resale_order_id: resaleOrder.id,
        p_buyer_email: buyerEmail,
        p_asaas_payment_id: payment.id,
        p_asaas_payment_status: payment.status || "RECEIVED",
        p_new_qr_code: newQr,
        p_new_qr_image_url: newQrImageUrl,
        p_paid_at: new Date().toISOString(),
      });

      if (settleErr || settled?.error) {
        console.error("Failed to settle resale order", { resaleOrderId, settleErr, settled });
        return false;
      } else {
        console.log("Resale order settled:", resaleOrderId);
      }
      break;
    }

    case "PAYMENT_OVERDUE":
    case "PAYMENT_DELETED": {
      if (["pending_payment", "payment_processing", "paid"].includes(resaleOrder.status)) {
        await supabase
          .from("resale_orders")
          .update({
            status: "expired",
            failure_reason: event === "PAYMENT_OVERDUE" ? "payment_overdue" : "payment_deleted",
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", resaleOrder.id);

        await supabase
          .from("resale_listings")
          .update({ status: "active", reserved_by: null, reserved_until: null, updated_at: new Date().toISOString() })
          .eq("id", resaleOrder.listing_id)
          .eq("status", "reserved");
      }
      break;
    }

    case "PAYMENT_REFUNDED":
    case "CHARGEBACK_REQUESTED":
    case "PAYMENT_CHARGEBACK_REQUESTED": {
      const reason = event === "PAYMENT_REFUNDED"
        ? (payment?.refund?.description || "refund")
        : (payment?.chargeback?.reason || "chargeback");

      const { data: reversed, error: reverseErr } = await supabase.rpc("reverse_resale_order_atomic", {
        p_resale_order_id: resaleOrder.id,
        p_reason: reason,
      });

      if (reverseErr || reversed?.error) {
        console.error("Failed to reverse resale order", { resaleOrderId, reverseErr, reversed });
        return false;
      }
      break;
    }

    default:
      console.log("Unhandled resale webhook event:", event, "for resale order:", resaleOrderId);
      break;
  }

  return true;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  let webhookEventId: string | null = null;
  let supabase: any = null;

  try {
    // C07: Mandatory webhook token validation
    const webhookToken = req.headers.get("asaas-access-token");
    const expectedToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");

    if (!expectedToken) {
      console.error("ASAAS_WEBHOOK_TOKEN not configured — rejecting webhook");
      return new Response("Server misconfigured", { status: 500, headers: corsHeaders });
    }

    if (webhookToken !== expectedToken) {
      console.error("Invalid webhook token");
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { event, payment } = body;

    if (!event || !payment) {
      return new Response("Invalid payload", { status: 400, headers: corsHeaders });
    }

    console.log(`asaas-webhook received: ${event} for payment ${payment.id}`);

    supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const externalReference = payment.externalReference;
    if (!externalReference) {
      console.error("No externalReference in payment");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const eventRegistration = await registerWebhookEvent(supabase, event, payment, String(externalReference));
    if (!eventRegistration.ok) {
      console.error("Failed to register webhook event", eventRegistration.error);
      return new Response("Retry", { status: 500, headers: corsHeaders });
    }

    webhookEventId = eventRegistration.eventId;
    if (!webhookEventId) {
      console.error("Webhook registration returned no eventId");
      return new Response("Retry", { status: 500, headers: corsHeaders });
    }

    if (!eventRegistration.shouldProcess) {
      console.log("Webhook replay skipped", {
        event,
        paymentId: payment.id,
        externalReference,
        status: eventRegistration.status,
        attemptCount: eventRegistration.attemptCount,
      });
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    if (String(externalReference).startsWith("resale:")) {
      const resaleOrderId = String(externalReference).replace("resale:", "");
      const ok = await handleResaleWebhook(supabase, event, payment, resaleOrderId);
      if (!ok) {
        await markWebhookFailed(supabase, webhookEventId, "resale_processing_failed");
        return new Response("Retry", { status: 500, headers: corsHeaders });
      }

      await markWebhookProcessed(supabase, webhookEventId);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const orderId = externalReference;
    if (!orderId) {
      console.error("No externalReference in payment");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, status, event_id, promoter_event_id")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      console.error("Order not found:", orderId);
      await markWebhookProcessed(supabase, webhookEventId);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    switch (event) {
      case "PAYMENT_RECEIVED":
      case "PAYMENT_CONFIRMED": {
        if (order.status === "paid") {
          console.log("Order already paid, skipping:", orderId);
          break;
        }

        const { data: confirmed } = await supabase.rpc("confirm_order_payment", {
          p_order_id: orderId,
          p_asaas_payment: payment.id,
          p_net_value: payment.netValue || payment.value,
        });

        if (confirmed) {
          console.log("Payment confirmed for order:", orderId);

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

      case "PAYMENT_OVERDUE": {
        // Mark as expired if still pending
        if (order.status === "pending") {
          await supabase
            .from("orders")
            .update({ status: "expired", payment_status: "expired", updated_at: new Date().toISOString() })
            .eq("id", orderId)
            .eq("status", "pending");

          // Release reserved tickets and restore inventory
          await releaseReservedTickets(supabase, orderId);
        }
        console.log("Payment overdue for order:", orderId);
        break;
      }

      case "PAYMENT_REFUNDED": {
        // A12: Idempotency — skip if already refunded
        if (order.status === "refunded") {
          console.log("Order already refunded, skipping:", orderId);
          break;
        }

        await supabase
          .from("orders")
          .update({
            status: "refunded", payment_status: "refunded",
            refunded_at: new Date().toISOString(), refunded_amount: payment.value,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        // Release any reserved tickets and restore inventory
        await releaseReservedTickets(supabase, orderId);
        // Also cancel active tickets (already confirmed ones)
        await supabase.from("tickets").update({ status: "cancelled" }).eq("order_id", orderId).eq("status", "active");

        if (order.promoter_event_id) {
          const { data: commission } = await supabase
            .from("promoter_commissions")
            .select("id, commission_amount, promoter_event_id, promoter_id")
            .eq("order_id", orderId)
            .eq("status", "pending")
            .maybeSingle();

          if (commission) {
            await supabase.from("promoter_commissions").update({ status: "cancelled" }).eq("id", commission.id);

            const { data: pe } = await supabase.from("promoter_events")
              .select("revenue_generated, conversions, commission_total")
              .eq("id", commission.promoter_event_id).single();

            if (pe) {
              await supabase.from("promoter_events").update({
                revenue_generated: Math.max(0, (pe.revenue_generated || 0) - payment.value),
                conversions: Math.max(0, (pe.conversions || 0) - 1),
                commission_total: Math.max(0, (pe.commission_total || 0) - commission.commission_amount),
              }).eq("id", commission.promoter_event_id);
            }

            const { data: promoter } = await supabase.from("promoters")
              .select("total_sales, total_commission_earned")
              .eq("id", commission.promoter_id).single();

            if (promoter) {
              await supabase.from("promoters").update({
                total_sales: Math.max(0, (promoter.total_sales || 0) - payment.value),
                total_commission_earned: Math.max(0, (promoter.total_commission_earned || 0) - commission.commission_amount),
              }).eq("id", commission.promoter_id);
            }
          }
        }

        console.log("Payment refunded for order:", orderId);
        break;
      }

      case "PAYMENT_DELETED":
      case "PAYMENT_RESTORED": {
        console.log(`Payment ${event} for order:`, orderId);
        if (event === "PAYMENT_DELETED" && order.status === "pending") {
          await supabase.from("orders").update({ status: "cancelled", payment_status: "cancelled", updated_at: new Date().toISOString() }).eq("id", orderId);
          await releaseReservedTickets(supabase, orderId);
        }
        break;
      }

      case "PAYMENT_REFUND_IN_PROGRESS": {
        console.log("Refund in progress for order:", orderId);
        await supabase.from("orders").update({ payment_status: "refund_in_progress", updated_at: new Date().toISOString() }).eq("id", orderId);
        break;
      }

      case "CHARGEBACK_REQUESTED":
      case "PAYMENT_CHARGEBACK_REQUESTED": {
        await supabase.from("orders").update({
          status: "chargeback", chargeback_status: "notified",
          chargeback_reason: payment.chargeback?.reason || "chargeback_requested",
          chargeback_notified_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }).eq("id", orderId);

        await supabase.from("tickets").update({ status: "suspended" }).eq("order_id", orderId).eq("status", "active");

        const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
        if (admins) {
          await supabase.from("notifications").insert(admins.map((a: any) => ({
            user_id: a.user_id, type: "chargeback", title: "Chargeback recebido",
            body: `Pedido ${orderId.slice(0, 8)} recebeu um chargeback. Tickets suspensos.`,
            data: { orderId, eventId: order.event_id },
          })));
        }

        console.log("Chargeback processed for order:", orderId);
        break;
      }

      case "PAYMENT_CHARGEBACK_DISPUTE":
      case "PAYMENT_AWAITING_CHARGEBACK_REVERSAL": {
        console.log(`Chargeback ${event} for order:`, orderId);
        await supabase.from("orders").update({
          chargeback_status: event === "PAYMENT_CHARGEBACK_DISPUTE" ? "dispute" : "awaiting_reversal",
          updated_at: new Date().toISOString(),
        }).eq("id", orderId);
        break;
      }

      case "PAYMENT_REPROVED_BY_RISK_ANALYSIS": {
        await supabase.from("orders").update({ status: "cancelled", payment_status: "failed", updated_at: new Date().toISOString() }).eq("id", orderId);

        const { data: cancelledTickets } = await supabase.from("tickets").select("tier_id").eq("order_id", orderId).eq("status", "reserved");
        if (cancelledTickets?.length) {
          await supabase.from("tickets").update({ status: "cancelled" }).eq("order_id", orderId).eq("status", "reserved");
          const tierCounts: Record<string, number> = {};
          for (const t of cancelledTickets) { tierCounts[t.tier_id] = (tierCounts[t.tier_id] || 0) + 1; }
          for (const [tierId, cnt] of Object.entries(tierCounts)) {
            const { data: tier } = await supabase.from("ticket_tiers").select("quantity_reserved").eq("id", tierId).single();
            if (tier) {
              await supabase.from("ticket_tiers").update({ quantity_reserved: Math.max(0, (tier.quantity_reserved || 0) - cnt) }).eq("id", tierId);
            }
          }
        }
        console.log("Payment reproved by risk analysis for order:", orderId);
        break;
      }

      default:
        console.warn("Unhandled webhook event:", event, "for order:", orderId);
    }

    await markWebhookProcessed(supabase, webhookEventId);
    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("asaas-webhook error:", error);
    if (supabase && webhookEventId) {
      await markWebhookFailed(supabase, webhookEventId, String((error as Error)?.message || "unknown_error"));
    }
    return new Response("Retry", { status: 500, headers: corsHeaders });
  }
});
