import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Asaas API helper — returns parsed JSON */
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
    return { _empty: true, httpStatus: res.status };
  }
  try {
    return JSON.parse(text);
  } catch {
    console.error("Asaas non-JSON response:", res.status, text.slice(0, 500));
    return { errors: [{ description: `Gateway returned HTTP ${res.status}` }] };
  }
};

/** Add N business days to a date */
const addBusinessDays = (date: Date, days: number): string => {
  let count = 0;
  const d = new Date(date);
  while (count < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return d.toISOString().split("T")[0];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } =
      await supabaseUser.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    const userEmail = userData.user.email;

    // Rate limit: max 10 payment attempts per hour per user
    const rlKey = `payment:${userId}`;
    const now = new Date();
    const { data: rl } = await supabaseAdmin.from("rate_limits").select("count, expires_at").eq("key", rlKey).maybeSingle();
    if (rl && new Date(rl.expires_at) > now && rl.count >= 10) {
      return new Response(JSON.stringify({ error: "Muitas tentativas. Aguarde alguns minutos." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!rl || new Date(rl.expires_at) <= now) {
      await supabaseAdmin.from("rate_limits").upsert({ key: rlKey, count: 1, expires_at: new Date(now.getTime() + 3600000).toISOString() });
    } else {
      await supabaseAdmin.from("rate_limits").update({ count: rl.count + 1 }).eq("key", rlKey);
    }

    // Parse body
    const { orderId, paymentMethod, creditCard, installments, payerCpf, payerDocumentNumber, payerDocumentType } =
      await req.json();

    if (!orderId || !paymentMethod) {
      return new Response(
        JSON.stringify({ error: "orderId and paymentMethod are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch order with validation
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("buyer_id", userId)
      .single();

    if (orderErr || !order) {
      return new Response(
        JSON.stringify({ error: "Pedido não encontrado ou acesso negado." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate order is in a payable state
    if (order.status === "paid") {
      return new Response(
        JSON.stringify({ success: true, alreadyCreated: true, immediateConfirmation: true, message: "Pedido já está pago." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (order.status !== "pending") {
      return new Response(
        JSON.stringify({ error: `Pedido não está pendente (status: ${order.status}). Crie um novo pedido.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // Check if order expired
    if (order.expires_at && new Date(order.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Pedido expirado. Por favor, crie um novo pedido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // Verify tickets exist for this order
    const { count: ticketCount } = await supabaseAdmin
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("order_id", orderId)
      .eq("status", "reserved");
    if (!ticketCount || ticketCount === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum ingresso reservado para este pedido. Tente novamente." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check idempotency — already has a payment
    if (order.asaas_payment_id) {
      // Return existing payment data
      return new Response(
        JSON.stringify({
          success: true,
          alreadyCreated: true,
          paymentId: order.asaas_payment_id,
          pixQrCode: order.pix_qr_code,
          pixQrCodeImage: order.pix_qr_code_image,
          boletoUrl: order.boleto_url,
          boletoBarcode: order.boleto_barcode,
          status: order.status,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch event + producer profile (for walletId)
    const { data: event } = await supabaseAdmin
      .from("events")
      .select("*, profiles!events_producer_id_fkey(*)")
      .eq("id", order.event_id)
      .single();

    if (!event) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const producer = (event as any).profiles;

    // Fetch buyer profile
    const { data: buyer } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    const normalizeDocument = (value: string) => value.replace(/\D/g, "");
    const requestedDocument = normalizeDocument(String(payerDocumentNumber || payerCpf || ""));
    const fallbackDocument = normalizeDocument(String((buyer as any)?.document_number || ""));
    const buyerDocument = requestedDocument || fallbackDocument;
    const buyerDocumentType = payerDocumentType || (buyer as any)?.document_type || (buyerDocument.length === 14 ? "cnpj" : "cpf");

    // ─── Check if Asaas is configured ───
    const asaasConfigured =
      !!Deno.env.get("ASAAS_API_KEY") && !!Deno.env.get("ASAAS_BASE_URL");

    if (!asaasConfigured) {
      // Stub mode: simulate payment flow for testing
      console.log(
        "ASAAS_NOT_CONFIGURED — running in stub mode for order:",
        orderId
      );

      const stubResult: Record<string, unknown> = {
        success: true,
        stub: true,
        message:
          "Asaas not configured. Payment simulated for testing purposes.",
        paymentMethod,
      };

      // Update order with stub data
      const updateData: Record<string, unknown> = {
        payment_method: paymentMethod,
        payment_gateway: "asaas_stub",
        payment_status: "pending",
        installments: installments || 1,
        updated_at: new Date().toISOString(),
      };

      if (paymentMethod === "credit_card") {
        // Block credit card in stub mode — no real gateway to charge
        return new Response(
          JSON.stringify({
            success: false,
            error: "Pagamento por cartão de crédito não está disponível no momento. Por favor, utilize PIX ou boleto.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (paymentMethod === "pix") {
        updateData.pix_qr_code = `STUB_PIX_${orderId}`;
        updateData.pix_qr_code_image = null;
        updateData.expires_at = new Date(
          Date.now() + 30 * 60 * 1000
        ).toISOString();
        stubResult.pixQrCode = updateData.pix_qr_code;
        stubResult.pixQrCodeImage = null;
        stubResult.expiresAt = updateData.expires_at;
      } else if (paymentMethod === "boleto") {
        updateData.boleto_url = `https://stub.asaas.com/boleto/${orderId}`;
        updateData.boleto_barcode = `23793.38128 60000.000003 00000.000402 1 ${Math.floor(
          Math.random() * 9e13
        )}`;
        stubResult.boletoUrl = updateData.boleto_url;
        stubResult.boletoBarcode = updateData.boleto_barcode;
      }

      await supabaseAdmin
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      // In stub mode, auto-confirm PIX/Boleto and generate QR codes for tickets
      console.log("Stub mode: auto-confirming payment for order", orderId);
      await supabaseAdmin.rpc("confirm_order_payment", {
        p_order_id: orderId,
        p_asaas_payment: `stub_${paymentMethod}_${orderId}`,
        p_net_value: Number(order.total) - Number(order.platform_fee || 0),
      });

      // Generate proper QR codes (JWT) for each ticket
      const { data: activatedTickets } = await supabaseAdmin
        .from("tickets")
        .select("id")
        .eq("order_id", orderId)
        .eq("status", "active");

      if (activatedTickets && activatedTickets.length > 0) {
        for (const ticket of activatedTickets) {
          try {
            await supabaseAdmin.functions.invoke("generate-qr-code", {
              body: { ticketId: ticket.id },
            });
          } catch (e) {
            console.error("Failed to generate QR for ticket", ticket.id, e);
          }
        }
      }

      // Update stub result to reflect confirmed status
      stubResult.status = "paid";
      stubResult.immediateConfirmation = true;

      return new Response(JSON.stringify(stubResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── REAL Asaas flow ───

    // 1. Create or find Asaas customer
    let customerId = order.asaas_customer_id;
    if (!customerId) {
      // Use payer document from request body (preferred), fallback to profile
      if (!buyerDocument) {
        return new Response(
          JSON.stringify({ error: "Documento é obrigatório para processar o pagamento. Por favor, preencha seu documento no checkout." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Also persist the document to the profile for future use
      if (requestedDocument) {
        await supabaseAdmin.from("profiles").update({ document_number: requestedDocument, document_type: buyerDocumentType }).eq("id", userId);
      }

      const customerRes = await asaas("POST", "/customers", {
        name: buyer?.full_name || "Comprador TicketHall",
        email: userEmail,
        cpfCnpj: buyerDocument,
        mobilePhone: buyer?.phone?.replace(/\D/g, "") || undefined,
        notificationDisabled: true,
      });

      if (customerRes._notConfigured) {
        return new Response(
          JSON.stringify({ error: "ASAAS_NOT_CONFIGURED" }),
          {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (customerRes.errors || customerRes._empty) {
        // Try to find existing customer by CPF
        if (buyerDocument) {
          const existing = await asaas(
            "GET",
            `/customers?cpfCnpj=${buyerDocument}`
          );
          if (existing.data?.[0]) {
            customerId = existing.data[0].id;
          } else {
            return new Response(
              JSON.stringify({
                error: "Falha ao criar cliente no gateway",
                details: customerRes.errors || [{ description: "Resposta vazia do gateway" }],
              }),
              {
                status: 400,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              }
            );
          }
        } else {
          return new Response(
            JSON.stringify({
              error: "Falha ao criar cliente no gateway",
              details: customerRes.errors || [{ description: "Resposta vazia do gateway" }],
            }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }
      } else if (!customerRes.id) {
        return new Response(
          JSON.stringify({ error: "Gateway não retornou o ID do cliente." }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        customerId = customerRes.id;
      }

      // Save customer ID for reuse
      await supabaseAdmin
        .from("orders")
        .update({ asaas_customer_id: customerId })
        .eq("id", orderId);
    }

    // 2. Build payment payload with split
    const today = new Date().toISOString().split("T")[0];
    const paymentPayload: Record<string, unknown> = {
      customer: customerId,
      value: Number(order.total),
      description: `TicketHall — ${event.title}`,
      externalReference: orderId,
    };

    // Add split if producer has wallet
    if (producer?.asaas_wallet_id) {
      paymentPayload.split = [
        {
          walletId: producer.asaas_wallet_id,
          percentualValue: 93,
        },
      ];
    }

    const updateData: Record<string, unknown> = {
      payment_method: paymentMethod,
      payment_gateway: "asaas",
      updated_at: new Date().toISOString(),
    };

    let responseData: Record<string, unknown> = { success: true };

    // 3. Create charge based on payment method
    if (paymentMethod === "pix") {
      paymentPayload.billingType = "PIX";
      paymentPayload.dueDate = today;

      const charge = await asaas("POST", "/payments", paymentPayload);
      if (charge.errors || charge._empty || !charge.id) {
        return new Response(
          JSON.stringify({
            error: "Não foi possível gerar cobrança PIX.",
            details: charge.errors || [{ description: "Gateway não retornou o ID da cobrança." }],
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch PIX QR Code (separate call)
      const pix = await asaas("GET", `/payments/${charge.id}/pixQrCode`);
      if (pix.errors || pix._empty || !pix.payload) {
        return new Response(
          JSON.stringify({
            error: "Cobrança PIX criada, mas o QR Code não foi retornado pelo gateway.",
            details: pix.errors || [{ description: "Resposta vazia ao buscar QR Code." }],
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      updateData.asaas_payment_id = charge.id;
      updateData.payment_status = "pending";
      updateData.pix_qr_code = pix.payload;
      updateData.pix_qr_code_image = pix.encodedImage || null;
      updateData.expires_at = pix.expirationDate || new Date(Date.now() + 30 * 60 * 1000).toISOString();

      responseData = {
        ...responseData,
        paymentId: charge.id,
        pixQrCode: pix.payload,
        pixQrCodeImage: pix.encodedImage,
        expiresAt: updateData.expires_at,
      };
    } else if (paymentMethod === "credit_card") {
      paymentPayload.billingType = "CREDIT_CARD";
      paymentPayload.dueDate = today;

      if (installments && installments > 1) {
        paymentPayload.installmentCount = installments;
        paymentPayload.installmentValue = Number(
          (Number(order.total) / installments).toFixed(2)
        );
      }

      if (creditCard) {
        paymentPayload.creditCard = {
          holderName: creditCard.holderName,
          number: creditCard.number?.replace(/\s/g, ""),
          expiryMonth: creditCard.expiryMonth,
          expiryYear: creditCard.expiryYear,
          ccv: creditCard.ccv,
        };
        paymentPayload.creditCardHolderInfo = {
          name: buyer?.full_name || creditCard.holderName,
          email: userEmail,
          cpfCnpj: buyerDocument,
          postalCode: creditCard.postalCode?.replace(/\D/g, "") || "",
          addressNumber: creditCard.addressNumber || "0",
          phone: buyer?.phone?.replace(/\D/g, "") || "",
        };
      }

      const charge = await asaas("POST", "/payments", paymentPayload);
      if (charge.errors || charge._empty || !charge.id) {
        return new Response(
          JSON.stringify({
            error: "Falha ao criar cobrança no cartão.",
            details: charge.errors || [{ description: "Gateway não retornou o ID da cobrança." }],
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      updateData.asaas_payment_id = charge.id;
      updateData.installments = installments || 1;
      updateData.installment_value = installments && installments > 1
        ? Number((Number(order.total) / installments).toFixed(2))
        : Number(order.total);

      if (charge.status === "CONFIRMED" || charge.status === "RECEIVED") {
        updateData.status = "paid";
        updateData.payment_status = "paid";
        updateData.net_amount = charge.netValue;

        // Confirm payment atomically
        await supabaseAdmin.rpc("confirm_order_payment", {
          p_order_id: orderId,
          p_asaas_payment: charge.id,
          p_net_value: charge.netValue,
        });

        responseData.immediateConfirmation = true;
      } else {
        updateData.payment_status = charge.status === "PENDING" ? "pending" : "processing";
      }

      responseData = {
        ...responseData,
        paymentId: charge.id,
        chargeStatus: charge.status,
        immediateConfirmation: responseData.immediateConfirmation || false,
      };
    } else if (paymentMethod === "boleto") {
      paymentPayload.billingType = "BOLETO";
      paymentPayload.dueDate = addBusinessDays(new Date(), 3);

      const charge = await asaas("POST", "/payments", paymentPayload);
      if (charge.errors || charge._empty || !charge.id) {
        return new Response(
          JSON.stringify({
            error: "Falha ao gerar boleto.",
            details: charge.errors || [{ description: "Gateway não retornou o ID da cobrança." }],
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!charge.bankSlipUrl) {
        return new Response(
          JSON.stringify({
            error: "Boleto criado sem link de pagamento.",
            details: [{ description: "Tente novamente em instantes." }],
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch barcode
      let barcode = null;
      try {
        const barcodeRes = await asaas("GET", `/payments/${charge.id}/identificationField`);
        barcode = barcodeRes.identificationField || null;
      } catch { /* barcode is optional */ }

      updateData.asaas_payment_id = charge.id;
      updateData.payment_status = "pending";
      updateData.boleto_url = charge.bankSlipUrl || null;
      updateData.boleto_barcode = barcode;

      responseData = {
        ...responseData,
        paymentId: charge.id,
        boletoUrl: charge.bankSlipUrl,
        boletoBarcode: barcode,
        dueDate: paymentPayload.dueDate,
      };
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid payment method. Use: pix, credit_card, boleto" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Update order
    const { error: updateOrderError } = await supabaseAdmin.from("orders").update(updateData).eq("id", orderId);
    if (updateOrderError) {
      return new Response(
        JSON.stringify({ error: "Falha ao atualizar pedido após criar pagamento.", details: updateOrderError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-payment error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
