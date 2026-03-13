import { supabase } from "@/integrations/supabase/client";

// ============================================================
// BANK ACCOUNTS
// ============================================================

export async function getBankAccounts(producerId: string) {
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("producer_id", producerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createBankAccount(account: {
  producer_id: string;
  account_name: string;
  bank_name?: string;
  agency?: string;
  account_number?: string;
  pix_key?: string;
  pix_key_type?: string;
  is_default?: boolean;
}) {
  // If setting as default, unset other defaults first
  if (account.is_default) {
    await supabase
      .from("bank_accounts")
      .update({ is_default: false })
      .eq("producer_id", account.producer_id);
  }
  const { data, error } = await supabase
    .from("bank_accounts")
    .insert(account)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBankAccount(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("bank_accounts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBankAccount(id: string) {
  const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// FINANCIAL TRANSACTIONS
// ============================================================

export async function getFinancialTransactions(producerId: string, filters?: {
  type?: string;
  status?: string;
  event_id?: string;
  category?: string;
  from_date?: string;
  to_date?: string;
}) {
  let query = supabase
    .from("financial_transactions")
    .select("*, events(title), bank_accounts(account_name)")
    .eq("producer_id", producerId)
    .order("created_at", { ascending: false });

  if (filters?.type) query = query.eq("type", filters.type);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.event_id) query = query.eq("event_id", filters.event_id);
  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.from_date) query = query.gte("due_date", filters.from_date);
  if (filters?.to_date) query = query.lte("due_date", filters.to_date);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createFinancialTransaction(tx: {
  producer_id: string;
  event_id?: string;
  order_id?: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  status?: string;
  due_date?: string;
  bank_account_id?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from("financial_transactions")
    .insert(tx)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFinancialTransaction(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("financial_transactions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFinancialTransaction(id: string) {
  const { error } = await supabase.from("financial_transactions").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// AUTO-SYNC: CREATE FINANCIAL TRANSACTIONS FROM ORDERS
// ============================================================

export async function syncOrderFinancials(producerId: string) {
  // 1. Get all producer event IDs
  const { data: events } = await supabase
    .from("events")
    .select("id, title, platform_fee_percent")
    .eq("producer_id", producerId);
  if (!events || events.length === 0) return;

  const eventIds = events.map(e => e.id);
  const eventMap = new Map(events.map(e => [e.id, e]));

  // 2. Get all existing order-linked financial_transactions to avoid duplicates
  const { data: existingTx } = await supabase
    .from("financial_transactions")
    .select("order_id, category")
    .eq("producer_id", producerId)
    .not("order_id", "is", null);

  const existingSet = new Set(
    (existingTx || []).map(t => `${t.order_id}__${t.category}`)
  );

  // 3. Paginate through all orders for producer events
  let allOrders: any[] = [];
  const PAGE = 1000;
  let offset = 0;
  while (true) {
    const { data: batch } = await supabase
      .from("orders")
      .select("id, event_id, status, total, subtotal, platform_fee, payment_gateway_fee, refunded_amount, created_at, profiles!orders_buyer_id_fkey(full_name)")
      .in("event_id", eventIds)
      .in("status", ["paid", "refunded"])
      .range(offset, offset + PAGE - 1);
    if (!batch || batch.length === 0) break;
    allOrders = allOrders.concat(batch);
    if (batch.length < PAGE) break;
    offset += PAGE;
  }

  // 4. Build inserts for missing transactions
  const inserts: any[] = [];

  for (const order of allOrders) {
    const evt = eventMap.get(order.event_id);
    const eventTitle = evt?.title || "Evento";
    const buyerName = (order as any).profiles?.full_name || "Comprador";

    // Receivable: ticket sale (net amount = total - platform_fee - gateway_fee)
    if (order.status === "paid" || order.status === "refunded") {
      const key = `${order.id}__ticket_sale`;
      if (!existingSet.has(key)) {
        const netAmount = Number(order.total) - Number(order.platform_fee || 0) - Number(order.payment_gateway_fee || 0);
        inserts.push({
          producer_id: producerId,
          event_id: order.event_id,
          order_id: order.id,
          type: "receivable",
          category: "ticket_sale",
          description: `Venda — ${eventTitle} — ${buyerName}`,
          amount: netAmount > 0 ? netAmount : 0,
          status: "confirmed",
          due_date: order.created_at?.slice(0, 10),
        });
        existingSet.add(key);
      }
    }

    // Payable: platform fee
    if ((order.status === "paid" || order.status === "refunded") && Number(order.platform_fee) > 0) {
      const key = `${order.id}__platform_fee`;
      if (!existingSet.has(key)) {
        inserts.push({
          producer_id: producerId,
          event_id: order.event_id,
          order_id: order.id,
          type: "payable",
          category: "platform_fee",
          description: `Taxa plataforma — ${eventTitle} — Pedido #${order.id.slice(0, 8)}`,
          amount: Number(order.platform_fee),
          status: "confirmed",
          due_date: order.created_at?.slice(0, 10),
        });
        existingSet.add(key);
      }
    }

    // Payable: refund
    if (order.status === "refunded" && Number(order.refunded_amount) > 0) {
      const key = `${order.id}__refund`;
      if (!existingSet.has(key)) {
        inserts.push({
          producer_id: producerId,
          event_id: order.event_id,
          order_id: order.id,
          type: "payable",
          category: "refund",
          description: `Reembolso — ${eventTitle} — ${buyerName}`,
          amount: Number(order.refunded_amount),
          status: "confirmed",
          due_date: order.created_at?.slice(0, 10),
        });
        existingSet.add(key);
      }
    }
  }

  // 5. Batch insert (Supabase supports up to ~1000 rows per insert)
  if (inserts.length > 0) {
    for (let i = 0; i < inserts.length; i += 500) {
      const chunk = inserts.slice(i, i + 500);
      await supabase.from("financial_transactions").insert(chunk);
    }
  }

  return inserts.length;
}

// ============================================================
// CASH FLOW SUMMARY
// ============================================================

export async function getCashFlowSummary(producerId: string) {
  const { data, error } = await supabase
    .from("financial_transactions")
    .select("type, status, amount, category, due_date")
    .eq("producer_id", producerId);
  if (error) throw error;

  const items = data || [];
  const receivable = items.filter(i => i.type === "receivable");
  const payable = items.filter(i => i.type === "payable");

  const totalReceivable = receivable.reduce((s, i) => s + Number(i.amount), 0);
  const totalPayable = payable.reduce((s, i) => s + Number(i.amount), 0);
  const confirmedReceivable = receivable.filter(i => i.status === "confirmed" || i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);
  const confirmedPayable = payable.filter(i => i.status === "confirmed" || i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);
  const pendingReceivable = receivable.filter(i => i.status === "pending").reduce((s, i) => s + Number(i.amount), 0);
  const pendingPayable = payable.filter(i => i.status === "pending").reduce((s, i) => s + Number(i.amount), 0);

  return {
    totalReceivable,
    totalPayable,
    confirmedReceivable,
    confirmedPayable,
    pendingReceivable,
    pendingPayable,
    balance: totalReceivable - totalPayable,
    items,
  };
}

// ============================================================
// EVENT RECONCILIATION
// ============================================================

export async function getEventReconciliation(producerId: string) {
  const { data: events, error: evtErr } = await supabase
    .from("events")
    .select("id, title, status, start_date, end_date, platform_fee_percent")
    .eq("producer_id", producerId)
    .order("start_date", { ascending: false });
  if (evtErr) throw evtErr;
  if (!events || events.length === 0) return [];

  const eventIds = events.map(e => e.id);

  // Paginate orders to avoid 1000-row limit
  let allOrders: any[] = [];
  const PAGE_SIZE = 1000;
  let offset = 0;
  while (true) {
    const { data: batch } = await supabase
      .from("orders")
      .select("event_id, status, total, platform_fee, payment_gateway_fee, refunded_amount")
      .in("event_id", eventIds)
      .range(offset, offset + PAGE_SIZE - 1);
    if (!batch || batch.length === 0) break;
    allOrders = allOrders.concat(batch);
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  const { data: analytics } = await supabase
    .from("event_analytics")
    .select("event_id, tickets_sold, tickets_checked_in, total_revenue, platform_revenue, producer_revenue")
    .in("event_id", eventIds);

  return events.map(event => {
    const eventOrders = allOrders.filter(o => o.event_id === event.id);
    const paidOrders = eventOrders.filter(o => o.status === "paid");
    const refundedOrders = eventOrders.filter(o => o.status === "refunded");
    const eventAnalytics = (analytics || []).find(a => a.event_id === event.id);

    const grossRevenue = paidOrders.reduce((s, o) => s + Number(o.total), 0);
    const platformFees = paidOrders.reduce((s, o) => s + Number(o.platform_fee || 0), 0);
    const gatewayFees = paidOrders.reduce((s, o) => s + Number(o.payment_gateway_fee || 0), 0);
    const refunds = refundedOrders.reduce((s, o) => s + Number(o.refunded_amount || 0), 0);
    const netRevenue = grossRevenue - platformFees - gatewayFees - refunds;

    return {
      ...event,
      ordersCount: paidOrders.length,
      ticketsSold: eventAnalytics?.tickets_sold || 0,
      ticketsCheckedIn: eventAnalytics?.tickets_checked_in || 0,
      grossRevenue,
      platformFees,
      gatewayFees,
      refunds,
      netRevenue,
    };
  });
}
