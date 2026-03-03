import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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
  return res.json();
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Parse body
    const { orderId, paymentMethod, creditCard, installments } =
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

    // Fetch order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("buyer_id", userId)
      .single();

    if (orderErr || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found or access denied" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
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
        status: "awaiting_payment",
        payment_status: "pending",
        installments: installments || 1,
        updated_at: new Date().toISOString(),
      };

      if (paymentMethod === "pix") {
        updateData.pix_qr_code = `STUB_PIX_${orderId}`;
        updateData.pix_qr_code_image = null;
        updateData.expires_at = new Date(
          Date.now() + 30 * 60 * 1000
        ).toISOString();
        stubResult.pixQrCode = updateData.pix_qr_code;
        stubResult.pixQrCodeImage = null;
        stubResult.expiresAt = updateData.expires_at;
      } else if (paymentMethod === "credit_card") {
        // In stub mode, simulate immediate confirmation
        updateData.status = "paid";
        updateData.payment_status = "paid";
        stubResult.immediateConfirmation = true;
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

      // If credit card stub, also confirm payment
      if (paymentMethod === "credit_card") {
        await supabaseAdmin.rpc("confirm_order_payment", {
          p_order_id: orderId,
          p_asaas_payment: `stub_${orderId}`,
          p_net_value: order.total * 0.98,
        });
      }

      return new Response(JSON.stringify(stubResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── REAL Asaas flow ───

    // 1. Create or find Asaas customer
    let customerId = order.asaas_customer_id;
    if (!customerId) {
      const customerRes = await asaas("POST", "/customers", {
        name: buyer?.full_name || "Comprador TicketHall",
        email: claimsData.claims.email,
        cpfCnpj: buyer?.cpf?.replace(/\D/g, "") || undefined,
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

      if (customerRes.errors) {
        // Try to find existing customer by CPF
        if (buyer?.cpf) {
          const existing = await asaas(
            "GET",
            `/customers?cpfCnpj=${buyer.cpf.replace(/\D/g, "")}`
          );
          if (existing.data?.[0]) {
            customerId = existing.data[0].id;
          } else {
            return new Response(
              JSON.stringify({
                error: "Failed to create customer",
                details: customerRes.errors,
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
        }
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
      if (charge.errors) {
        return new Response(
          JSON.stringify({ error: "Payment creation failed", details: charge.errors }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch PIX QR Code (separate call)
      const pix = await asaas("GET", `/payments/${charge.id}/pixQrCode`);

      updateData.asaas_payment_id = charge.id;
      updateData.status = "awaiting_payment";
      updateData.payment_status = "pending";
      updateData.pix_qr_code = pix.payload || null;
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
          email: claimsData.claims.email,
          cpfCnpj: buyer?.cpf?.replace(/\D/g, "") || "",
          postalCode: creditCard.postalCode?.replace(/\D/g, "") || "",
          addressNumber: creditCard.addressNumber || "0",
          phone: buyer?.phone?.replace(/\D/g, "") || "",
        };
      }

      const charge = await asaas("POST", "/payments", paymentPayload);
      if (charge.errors) {
        return new Response(
          JSON.stringify({ error: "Payment creation failed", details: charge.errors }),
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
        updateData.status = "awaiting_payment";
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
      if (charge.errors) {
        return new Response(
          JSON.stringify({ error: "Payment creation failed", details: charge.errors }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch barcode
      let barcode = null;
      try {
        const barcodeRes = await asaas("GET", `/payments/${charge.id}/identificationField`);
        barcode = barcodeRes.identificationField || null;
      } catch { /* barcode is optional */ }

      updateData.asaas_payment_id = charge.id;
      updateData.status = "awaiting_payment";
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
    await supabaseAdmin.from("orders").update(updateData).eq("id", orderId);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
