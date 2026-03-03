import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id required" }), { status: 400, headers: corsHeaders });
    }

    // Fetch order with relations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: orderErr } = await adminClient
      .from("orders")
      .select("*, events(title, venue_name, venue_city, start_date), profiles!orders_buyer_id_fkey(full_name, cpf)")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: corsHeaders });
    }

    // Fetch tickets for this order
    const { data: tickets } = await adminClient
      .from("tickets")
      .select("id, attendee_name, ticket_tiers(name, price)")
      .eq("order_id", order_id);

    // Generate invoice number
    const invoiceNumber = `TH-${new Date().getFullYear()}-${order_id.slice(0, 8).toUpperCase()}`;

    // Build HTML invoice
    const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
    const ticketRows = (tickets || [])
      .map(
        (t: any, i: number) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee;">${i + 1}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${t.ticket_tiers?.name || "Ingresso"}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${t.attendee_name || "—"}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${fmt(t.ticket_tiers?.price || 0)}</td>
          </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Nota Fiscal ${invoiceNumber}</title></head>
<body style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#222;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;">
    <div>
      <h1 style="margin:0;font-size:28px;color:#5046e5;">TicketHall</h1>
      <p style="margin:4px 0 0;color:#666;font-size:14px;">Plataforma de Ingressos</p>
    </div>
    <div style="text-align:right;">
      <h2 style="margin:0;font-size:18px;">NOTA FISCAL</h2>
      <p style="margin:4px 0 0;color:#666;font-size:14px;">${invoiceNumber}</p>
      <p style="margin:2px 0 0;color:#666;font-size:14px;">${new Date().toLocaleDateString("pt-BR")}</p>
    </div>
  </div>

  <div style="display:flex;justify-content:space-between;margin-bottom:30px;">
    <div>
      <h3 style="margin:0 0 8px;font-size:14px;color:#666;text-transform:uppercase;">Comprador</h3>
      <p style="margin:0;font-weight:bold;">${order.profiles?.full_name || "—"}</p>
      <p style="margin:2px 0;color:#666;font-size:14px;">CPF: ${order.profiles?.cpf || "—"}</p>
      ${order.billing_company_name ? `<p style="margin:2px 0;font-size:14px;">${order.billing_company_name}</p>` : ""}
      ${order.billing_cnpj ? `<p style="margin:2px 0;color:#666;font-size:14px;">CNPJ: ${order.billing_cnpj}</p>` : ""}
    </div>
    <div style="text-align:right;">
      <h3 style="margin:0 0 8px;font-size:14px;color:#666;text-transform:uppercase;">Evento</h3>
      <p style="margin:0;font-weight:bold;">${order.events?.title || "—"}</p>
      <p style="margin:2px 0;color:#666;font-size:14px;">${order.events?.venue_name || ""}${order.events?.venue_city ? ` — ${order.events.venue_city}` : ""}</p>
      <p style="margin:2px 0;color:#666;font-size:14px;">${order.events?.start_date ? new Date(order.events.start_date).toLocaleDateString("pt-BR") : ""}</p>
    </div>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
    <thead>
      <tr style="background:#f5f5f5;">
        <th style="padding:10px 8px;text-align:left;font-size:13px;">#</th>
        <th style="padding:10px 8px;text-align:left;font-size:13px;">Lote</th>
        <th style="padding:10px 8px;text-align:left;font-size:13px;">Participante</th>
        <th style="padding:10px 8px;text-align:right;font-size:13px;">Valor</th>
      </tr>
    </thead>
    <tbody>${ticketRows}</tbody>
  </table>

  <div style="border-top:2px solid #222;padding-top:16px;">
    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
      <span style="color:#666;">Subtotal</span><span>${fmt(order.subtotal)}</span>
    </div>
    ${order.discount_amount > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:#666;">Desconto</span><span style="color:green;">-${fmt(order.discount_amount)}</span></div>` : ""}
    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
      <span style="color:#666;">Taxa de Serviço</span><span>${fmt(order.platform_fee)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:bold;margin-top:10px;padding-top:10px;border-top:1px solid #ddd;">
      <span>Total</span><span>${fmt(order.total)}</span>
    </div>
  </div>

  <div style="margin-top:40px;padding:16px;background:#f9f9f9;border-radius:8px;">
    <p style="margin:0;font-size:12px;color:#666;">
      Método de pagamento: <strong>${order.payment_method || "—"}</strong><br/>
      ID do pedido: <strong>${order.id}</strong><br/>
      Status: <strong>${order.status}</strong>
    </p>
  </div>

  <p style="text-align:center;margin-top:40px;color:#999;font-size:11px;">
    Documento gerado automaticamente pela plataforma TicketHall — tickethall.com.br
  </p>
</body>
</html>`;

    // Update order with invoice info
    await adminClient
      .from("orders")
      .update({
        invoice_number: invoiceNumber,
        invoice_issued_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    return new Response(
      JSON.stringify({ invoice_number: invoiceNumber, html }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
