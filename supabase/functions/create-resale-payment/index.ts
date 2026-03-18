// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const asaas = async (method: string, path: string, body?: unknown) => {
  const baseUrl = Deno.env.get("ASAAS_BASE_URL");
  const apiKey = Deno.env.get("ASAAS_API_KEY");
  if (!baseUrl || !apiKey) return { _notConfigured: true };

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  if (!text) {
    if (!res.ok) {
      return { errors: [{ description: `Gateway returned HTTP ${res.status}` }] };
    }
    return { _empty: true };
  }

  try {
    return JSON.parse(text);
  } catch {
    return { errors: [{ description: `Gateway returned non-JSON HTTP ${res.status}` }] };
  }
};

const addBusinessDays = (date: Date, days: number): string => {
  const d = new Date(date);
  let count = 0;
  while (count < days) {
    d.setDate(d.getDate() + 1);
    const weekday = d.getDay();
    if (weekday !== 0 && weekday !== 6) count++;
  }
  return d.toISOString().split("T")[0];
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const buyerId = userData.user.id;
    const buyerEmail = userData.user.email || "";

    const body = await req.json();
    const {
      listingId,
      paymentMethod,
      creditCard,
      installments,
      payerCpf,
      reservationMinutes,
      useWalletCredit,
    } = body || {};

    if (!listingId || !paymentMethod) {
      return new Response(JSON.stringify({ success: false, error: "listingId and paymentMethod are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["pix", "credit_card", "boleto"].includes(paymentMethod)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid payment method" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rlKey = `resale-payment:${buyerId}`;
    const now = new Date();
    const { data: rl } = await supabaseAdmin.from("rate_limits").select("count, expires_at").eq("key", rlKey).maybeSingle();
    if (rl && new Date(rl.expires_at) > now && rl.count >= 20) {
      return new Response(JSON.stringify({ success: false, error: "Muitas tentativas. Aguarde alguns minutos." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!rl || new Date(rl.expires_at) <= now) {
      await supabaseAdmin.from("rate_limits").upsert({ key: rlKey, count: 1, expires_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString() });
    } else {
      await supabaseAdmin.from("rate_limits").update({ count: rl.count + 1 }).eq("key", rlKey);
    }

    // Prevent stale reservations from blocking listing purchases.
    await supabaseAdmin.rpc("cleanup_expired_resale_orders");

    const { data: createOrderResult, error: createOrderErr } = await supabaseAdmin.rpc("create_resale_order_atomic", {
      p_listing_id: listingId,
      p_buyer_id: buyerId,
      p_payment_method: paymentMethod,
      p_reservation_minutes: reservationMinutes || 15,
    });

    if (createOrderErr) {
      console.error("create_resale_order_atomic error", createOrderErr);
      return new Response(JSON.stringify({ success: false, error: "Erro ao iniciar checkout de revenda" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (createOrderResult?.error) {
      return new Response(JSON.stringify({ success: false, error: createOrderResult.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resaleOrderId = createOrderResult?.resaleOrderId as string;
    if (!resaleOrderId) {
      return new Response(JSON.stringify({ success: false, error: "Falha ao criar ordem de revenda" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: resaleOrder } = await supabaseAdmin
      .from("resale_orders")
      .select("id, buyer_id, ticket_id, event_id, amount_gross, asaas_payment_id, status, payment_method, pix_qr_code, pix_qr_code_image, boleto_url, boleto_barcode")
      .eq("id", resaleOrderId)
      .eq("buyer_id", buyerId)
      .single();

    if (!resaleOrder) {
      return new Response(JSON.stringify({ success: false, error: "Ordem de revenda não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (resaleOrder.status === "settled") {
      return new Response(JSON.stringify({
        success: true,
        alreadyCreated: true,
        immediateConfirmation: true,
        resaleOrderId,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (
      resaleOrder.asaas_payment_id
      && ["pending_payment", "payment_processing"].includes(resaleOrder.status)
    ) {
      return new Response(JSON.stringify({
        success: true,
        alreadyCreated: true,
        resaleOrderId: resaleOrder.id,
        paymentId: resaleOrder.asaas_payment_id,
        chargeStatus: resaleOrder.status,
        paymentMethod: resaleOrder.payment_method,
        pixQrCode: resaleOrder.pix_qr_code,
        pixQrCodeImage: resaleOrder.pix_qr_code_image,
        boletoUrl: resaleOrder.boleto_url,
        boletoBarcode: resaleOrder.boleto_barcode,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: ticket } = await supabaseAdmin
      .from("tickets")
      .select("id, order_id")
      .eq("id", resaleOrder.ticket_id)
      .single();

    const qrSecret = Deno.env.get("QR_SECRET");
    if (!qrSecret) {
      return new Response(JSON.stringify({ success: false, error: "QR_SECRET não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const asaasConfigured = !!Deno.env.get("ASAAS_API_KEY") && !!Deno.env.get("ASAAS_BASE_URL");

    if (useWalletCredit === true) {
      const gross = Number(resaleOrder.amount_gross || 0);

      if (gross > 0) {
        const walletPaymentRef = `wallet_${resaleOrder.id}`;
        const payload = {
          tid: resaleOrder.ticket_id,
          eid: resaleOrder.event_id,
          oid: ticket?.order_id,
          uid: buyerId,
          v: 2,
          iat: Math.floor(Date.now() / 1000),
        };
        const newQr = await createJWT(payload, qrSecret);
        const newQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(newQr)}`;

        const { data: debitResult, error: debitErr } = await supabaseAdmin.rpc("wallet_debit_available_atomic", {
          p_user_id: buyerId,
          p_amount: gross,
          p_reference_id: resaleOrder.id,
          p_description: "Uso de saldo em compra de revenda",
        });

        if (debitErr || debitResult?.error) {
          return new Response(JSON.stringify({ success: false, error: debitResult?.error || "Saldo insuficiente para compra por carteira" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: settled, error: settleErr } = await supabaseAdmin.rpc("settle_resale_order_atomic", {
          p_resale_order_id: resaleOrder.id,
          p_buyer_email: buyerEmail,
          p_asaas_payment_id: walletPaymentRef,
          p_asaas_payment_status: "RECEIVED",
          p_new_qr_code: newQr,
          p_new_qr_image_url: newQrImageUrl,
          p_paid_at: new Date().toISOString(),
        });

        if (settleErr || settled?.error) {
          // Compensating action: refund wallet balance when settlement fails.
          const { data: refundResult, error: refundErr } = await supabaseAdmin.rpc("wallet_refund_available_atomic", {
            p_user_id: buyerId,
            p_amount: gross,
            p_reference_id: resaleOrder.id,
            p_description: "Estorno automático por falha na liquidação da revenda",
          });

          if (refundErr || refundResult?.error) {
            console.error("Critical: wallet compensation failed after resale settlement error", {
              resaleOrderId: resaleOrder.id,
              settleErr,
              settled,
              refundErr,
              refundResult,
            });

            return new Response(JSON.stringify({
              success: false,
              error: "Falha crítica na compensação do saldo. Nossa equipe foi notificada para ajuste manual.",
              code: "wallet_compensation_failed",
            }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ success: false, error: settled?.error || "Erro ao liquidar revenda por saldo" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({
          success: true,
          immediateConfirmation: true,
          paymentId: walletPaymentRef,
          resaleOrderId,
          method: "wallet_credit",
          ...settled,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    if (!asaasConfigured) {
      const stubPaymentRef = `stub_resale_${resaleOrder.id}`;
      const payload = {
        tid: resaleOrder.ticket_id,
        eid: resaleOrder.event_id,
        oid: ticket?.order_id,
        uid: buyerId,
        v: 2,
        iat: Math.floor(Date.now() / 1000),
      };
      const newQr = await createJWT(payload, qrSecret);
      const newQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(newQr)}`;

      const { data: settled, error: settleErr } = await supabaseAdmin.rpc("settle_resale_order_atomic", {
        p_resale_order_id: resaleOrder.id,
        p_buyer_email: buyerEmail,
        p_asaas_payment_id: stubPaymentRef,
        p_asaas_payment_status: "RECEIVED",
        p_new_qr_code: newQr,
        p_new_qr_image_url: newQrImageUrl,
        p_paid_at: new Date().toISOString(),
      });

      if (settleErr || settled?.error) {
        return new Response(JSON.stringify({ success: false, error: settled?.error || "Erro ao concluir revenda em modo stub" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        stub: true,
        immediateConfirmation: true,
        paymentId: stubPaymentRef,
        resaleOrderId,
        ...settled,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: buyerProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, cpf, phone")
      .eq("id", buyerId)
      .maybeSingle();

    let asaasCustomerId: string | null = null;
    const effectiveCpf = String(payerCpf || buyerProfile?.cpf || "").replace(/\D/g, "");

    if (!effectiveCpf) {
      return new Response(JSON.stringify({ success: false, error: "CPF é obrigatório para pagamento" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payerCpf) {
      await supabaseAdmin.from("profiles").update({ cpf: payerCpf }).eq("id", buyerId);
    }

    const customerRes = await asaas("POST", "/customers", {
      name: buyerProfile?.full_name || "Comprador TicketHall",
      email: buyerEmail,
      cpfCnpj: effectiveCpf,
      mobilePhone: buyerProfile?.phone?.replace(/\D/g, "") || undefined,
      notificationDisabled: true,
    });

    if (customerRes.errors || !customerRes.id) {
      const existing = await asaas("GET", `/customers?cpfCnpj=${effectiveCpf}`);
      if (existing?.data?.[0]?.id) {
        asaasCustomerId = existing.data[0].id;
      } else {
        return new Response(JSON.stringify({ success: false, error: "Falha ao criar cliente no gateway" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      asaasCustomerId = customerRes.id;
    }

    const total = Number(resaleOrder.amount_gross || 0);
    const today = new Date().toISOString().split("T")[0];

    const paymentPayload: Record<string, unknown> = {
      customer: asaasCustomerId,
      value: total,
      description: "TicketHall - Compra de ingresso em revenda oficial",
      externalReference: `resale:${resaleOrder.id}`,
    };

    let updatePayload: Record<string, unknown> = {
      status: "payment_processing",
      payment_method: paymentMethod,
      updated_at: new Date().toISOString(),
    };

    const responseData: Record<string, unknown> = {
      success: true,
      resaleOrderId: resaleOrder.id,
      amountGross: total,
      expiresAt: createOrderResult?.expiresAt,
    };

    if (paymentMethod === "pix") {
      paymentPayload.billingType = "PIX";
      paymentPayload.dueDate = today;

      const charge = await asaas("POST", "/payments", paymentPayload);
      if (charge.errors || !charge.id) {
        return new Response(JSON.stringify({ success: false, error: "Não foi possível gerar cobrança PIX" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const pix = await asaas("GET", `/payments/${charge.id}/pixQrCode`);
      if (pix.errors || !pix.payload) {
        return new Response(JSON.stringify({ success: false, error: "PIX criado sem QR Code" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      updatePayload = {
        ...updatePayload,
        status: "pending_payment",
        asaas_payment_id: charge.id,
        asaas_payment_status: charge.status || "PENDING",
        pix_qr_code: pix.payload,
        pix_qr_code_image: pix.encodedImage || null,
      };

      responseData.paymentId = charge.id;
      responseData.pixQrCode = pix.payload;
      responseData.pixQrCodeImage = pix.encodedImage || null;
    } else if (paymentMethod === "boleto") {
      paymentPayload.billingType = "BOLETO";
      paymentPayload.dueDate = addBusinessDays(new Date(), 3);

      const charge = await asaas("POST", "/payments", paymentPayload);
      if (charge.errors || !charge.id || !charge.bankSlipUrl) {
        return new Response(JSON.stringify({ success: false, error: "Não foi possível gerar boleto" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let barcode: string | null = null;
      try {
        const barcodeRes = await asaas("GET", `/payments/${charge.id}/identificationField`);
        barcode = barcodeRes.identificationField || null;
      } catch {
        barcode = null;
      }

      updatePayload = {
        ...updatePayload,
        status: "pending_payment",
        asaas_payment_id: charge.id,
        asaas_payment_status: charge.status || "PENDING",
        boleto_url: charge.bankSlipUrl,
        boleto_barcode: barcode,
      };

      responseData.paymentId = charge.id;
      responseData.boletoUrl = charge.bankSlipUrl;
      responseData.boletoBarcode = barcode;
      responseData.dueDate = paymentPayload.dueDate;
    } else {
      paymentPayload.billingType = "CREDIT_CARD";
      paymentPayload.dueDate = today;

      if (installments && installments > 1) {
        paymentPayload.installmentCount = installments;
        paymentPayload.installmentValue = Number((total / installments).toFixed(2));
      }

      if (!creditCard) {
        return new Response(JSON.stringify({ success: false, error: "Dados do cartão são obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      paymentPayload.creditCard = {
        holderName: creditCard.holderName,
        number: String(creditCard.number || "").replace(/\s/g, ""),
        expiryMonth: creditCard.expiryMonth,
        expiryYear: creditCard.expiryYear,
        ccv: creditCard.ccv,
      };

      paymentPayload.creditCardHolderInfo = {
        name: buyerProfile?.full_name || creditCard.holderName,
        email: buyerEmail,
        cpfCnpj: effectiveCpf,
        postalCode: String(creditCard.postalCode || "").replace(/\D/g, ""),
        addressNumber: creditCard.addressNumber || "0",
        phone: String(buyerProfile?.phone || "").replace(/\D/g, ""),
      };

      const charge = await asaas("POST", "/payments", paymentPayload);
      if (charge.errors || !charge.id) {
        return new Response(JSON.stringify({ success: false, error: "Falha ao processar pagamento com cartão" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      updatePayload = {
        ...updatePayload,
        asaas_payment_id: charge.id,
        asaas_payment_status: charge.status || "PENDING",
      };

      responseData.paymentId = charge.id;
      responseData.chargeStatus = charge.status;

      if (charge.status === "CONFIRMED" || charge.status === "RECEIVED") {
        const payload = {
          tid: resaleOrder.ticket_id,
          eid: resaleOrder.event_id,
          oid: ticket?.order_id,
          uid: buyerId,
          v: 2,
          iat: Math.floor(Date.now() / 1000),
        };
        const newQr = await createJWT(payload, qrSecret);
        const newQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(newQr)}`;

        const { data: settled, error: settleErr } = await supabaseAdmin.rpc("settle_resale_order_atomic", {
          p_resale_order_id: resaleOrder.id,
          p_buyer_email: buyerEmail,
          p_asaas_payment_id: charge.id,
          p_asaas_payment_status: charge.status,
          p_new_qr_code: newQr,
          p_new_qr_image_url: newQrImageUrl,
          p_paid_at: new Date().toISOString(),
        });

        if (settleErr || settled?.error) {
          return new Response(JSON.stringify({ success: false, error: settled?.error || "Erro ao concluir revenda" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        updatePayload = {
          ...updatePayload,
          status: "settled",
          paid_at: new Date().toISOString(),
          settled_at: new Date().toISOString(),
        };

        responseData.immediateConfirmation = true;
        responseData.ticketId = settled?.ticketId;
      }
    }

    const { error: updateErr } = await supabaseAdmin
      .from("resale_orders")
      .update(updatePayload)
      .eq("id", resaleOrder.id)
      .eq("buyer_id", buyerId);

    if (updateErr) {
      return new Response(JSON.stringify({ success: false, error: "Falha ao atualizar ordem de revenda" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-resale-payment error", error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
