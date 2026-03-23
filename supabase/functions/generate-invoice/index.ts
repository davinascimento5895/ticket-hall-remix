/// <reference path="./types.d.ts" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const callerId = userData.user.id;

    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id required" }), { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: orderErr } = await adminClient
      .from("orders")
      .select("*, events(title, venue_name, venue_city, start_date, producer_id), profiles!orders_buyer_id_fkey(full_name, cpf)")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: corsHeaders });
    }

    // C10: Verify ownership — caller must be the buyer, event producer, or admin
    const isAdmin = await adminClient.from("user_roles").select("id").eq("user_id", callerId).eq("role", "admin").maybeSingle();
    const isBuyer = order.buyer_id === callerId;
    const isProducer = (order.events as any)?.producer_id === callerId;

    if (!isBuyer && !isProducer && !isAdmin.data) {
      return new Response(JSON.stringify({ error: "Not authorized to generate invoice for this order" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch tickets for this order
    const { data: tickets } = await adminClient
      .from("tickets")
      .select("id, attendee_name, ticket_tiers(name, price)")
      .eq("order_id", order_id);

    const invoiceNumber = `TH-${new Date().getFullYear()}-${order_id.slice(0, 8).toUpperCase()}`;

    const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
    const eventData = (order.events as any) || {};
    const eventLocation = `${eventData.venue_name || ""}${eventData.venue_city ? ` - ${eventData.venue_city}` : ""}`.trim();

    const ticketData = (tickets || []).map((t: any) => ({
      name: t.ticket_tiers?.name || "Ingresso",
      attendee_name: t.attendee_name || null,
      price: Number(t.ticket_tiers?.price || 0),
    }));

    const ticketRows = ticketData
      .map(
        (t: any, i: number) =>
          `<tr>
            <td style="padding:10px 8px;border-bottom:1px solid #ececf1;color:#616170;">${i + 1}</td>
            <td style="padding:10px 8px;border-bottom:1px solid #ececf1;">${t.name}</td>
            <td style="padding:10px 8px;border-bottom:1px solid #ececf1;">${t.attendee_name || "-"}</td>
            <td style="padding:10px 8px;border-bottom:1px solid #ececf1;text-align:right;">${fmt(t.price)}</td>
          </tr>`
      )
      .join("");

    const invoicePayload = {
      invoice_number: invoiceNumber,
      issued_at: new Date().toISOString(),
      order_id: order.id,
      buyer_name: order.profiles?.full_name || "-",
      buyer_cpf: order.profiles?.cpf || null,
      billing_company_name: order.billing_company_name || null,
      billing_cnpj: order.billing_cnpj || null,
      event_title: eventData.title || "-",
      event_location: eventLocation || "-",
      event_date: eventData.start_date || null,
      payment_method: order.payment_method || null,
      order_status: order.status,
      subtotal: Number(order.subtotal || 0),
      discount_amount: Number(order.discount_amount || 0),
      platform_fee: Number(order.platform_fee || 0),
      total: Number(order.total || 0),
      tickets: ticketData,
    };

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nota ${invoiceNumber}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { font-family: Inter, Arial, sans-serif; background:#f6f6f8; margin:0; color:#141414; }
    .page { max-width: 920px; margin: 0 auto; padding: 28px 22px 40px; }
    .sheet { background:#fff; border:1px solid #ececf1; border-radius:14px; overflow:hidden; }
    .topbar { height:8px; background:#ea580c; }
    .head { padding:20px 24px 16px; display:flex; justify-content:space-between; gap:16px; }
    .brand h1 { margin:0; font-size:24px; }
    .brand p { margin:4px 0 0; color:#616170; font-size:13px; }
    .doc { text-align:right; }
    .doc h2 { margin:0; font-size:16px; }
    .doc p { margin:4px 0 0; color:#616170; font-size:13px; }
    .block { margin:0 24px 18px; padding:14px; border:1px solid #ececf1; border-radius:10px; }
    .block h3 { margin:0 0 8px; font-size:11px; color:#616170; letter-spacing:.04em; text-transform:uppercase; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap:14px; }
    .title { margin:0; font-size:15px; font-weight:700; }
    .meta { margin:4px 0 0; font-size:13px; color:#616170; }
    table { width:100%; border-collapse:collapse; }
    thead tr { background:#f6f6f8; }
    th { text-align:left; padding:10px 8px; font-size:12px; color:#616170; font-weight:600; }
    .table-wrap { margin:0 24px 18px; border:1px solid #ececf1; border-radius:10px; overflow:hidden; }
    .totals { margin:0 24px 18px; padding:14px; border:1px solid #ececf1; border-radius:10px; }
    .line { display:flex; justify-content:space-between; margin:0 0 8px; color:#616170; font-size:14px; }
    .line.total { margin-top:10px; padding-top:10px; border-top:1px solid #ececf1; color:#141414; font-weight:700; font-size:18px; }
    .footer { margin:0 24px 24px; font-size:12px; color:#616170; line-height:1.6; }
    @media print {
      body { background:#fff; }
      .page { max-width: 100%; padding: 0; }
      .sheet { border:none; border-radius:0; }
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="sheet">
      <div class="topbar"></div>
      <header class="head">
        <div class="brand">
          <h1>TicketHall</h1>
          <p>Comprovante fiscal do pedido</p>
        </div>
        <div class="doc">
          <h2>NOTA</h2>
          <p>${invoiceNumber}</p>
          <p>${new Date().toLocaleDateString("pt-BR")}</p>
        </div>
      </header>

      <section class="grid" style="margin:0 24px 18px;">
        <div class="block" style="margin:0;">
          <h3>Comprador</h3>
          <p class="title">${invoicePayload.buyer_name}</p>
          ${invoicePayload.buyer_cpf ? `<p class="meta">CPF: ${invoicePayload.buyer_cpf}</p>` : ""}
          ${invoicePayload.billing_company_name ? `<p class="meta">${invoicePayload.billing_company_name}</p>` : ""}
          ${invoicePayload.billing_cnpj ? `<p class="meta">CNPJ: ${invoicePayload.billing_cnpj}</p>` : ""}
        </div>

        <div class="block" style="margin:0;">
          <h3>Evento</h3>
          <p class="title">${invoicePayload.event_title}</p>
          <p class="meta">${invoicePayload.event_location || "-"}</p>
          ${invoicePayload.event_date ? `<p class="meta">${new Date(invoicePayload.event_date).toLocaleDateString("pt-BR")}</p>` : ""}
        </div>
      </section>

      <section class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:48px;">#</th>
              <th>Lote</th>
              <th>Participante</th>
              <th style="text-align:right;">Valor</th>
            </tr>
          </thead>
          <tbody>${ticketRows}</tbody>
        </table>
      </section>

      <section class="totals">
        <p class="line"><span>Subtotal</span><span>${fmt(invoicePayload.subtotal)}</span></p>
        ${invoicePayload.discount_amount > 0 ? `<p class="line"><span>Desconto</span><span>-${fmt(invoicePayload.discount_amount)}</span></p>` : ""}
        <p class="line"><span>Taxa de servico</span><span>${fmt(invoicePayload.platform_fee)}</span></p>
        <p class="line total"><span>Total</span><span>${fmt(invoicePayload.total)}</span></p>
      </section>

      <p class="footer">
        Metodo de pagamento: <strong>${invoicePayload.payment_method || "-"}</strong><br/>
        Pedido: <strong>${invoicePayload.order_id}</strong> | Status: <strong>${invoicePayload.order_status}</strong><br/>
        Documento gerado automaticamente pela plataforma TicketHall.
      </p>
    </section>
  </main>
</body>
</html>`;

    await adminClient
      .from("orders")
      .update({ invoice_number: invoiceNumber, invoice_issued_at: new Date().toISOString() })
      .eq("id", order_id);

    return new Response(
      JSON.stringify({ invoice_number: invoiceNumber, html, invoice: invoicePayload }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
