import { supabase } from "@/integrations/supabase/client";

// ============================================================
// ADMIN — DASHBOARD
// ============================================================

export async function getAdminDashboardStats() {
  // Use count-only queries and minimal selects to avoid downloading all rows
  const [eventsCountRes, ordersCountRes, usersCountRes, analyticsRes, eventStatusRes, orderStatusRes, recentOrdersRes] = await Promise.all([
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("event_analytics").select("total_revenue, platform_revenue, tickets_sold"),
    supabase.from("events").select("status"),
    supabase.from("orders").select("status"),
    // Only fetch paid orders from last 6 months for the chart
    supabase.from("orders").select("total, created_at")
      .eq("status", "paid")
      .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString()),
  ]);

  const analytics = analyticsRes.data || [];
  const totalGMV = analytics.reduce((s, a) => s + (a.total_revenue || 0), 0);
  const platformRevenue = analytics.reduce((s, a) => s + (a.platform_revenue || 0), 0);
  const ticketsSold = analytics.reduce((s, a) => s + (a.tickets_sold || 0), 0);

  // Count statuses client-side from minimal data
  const eventsByStatus: Record<string, number> = {};
  (eventStatusRes.data || []).forEach((e) => {
    const s = e.status || "draft";
    eventsByStatus[s] = (eventsByStatus[s] || 0) + 1;
  });

  const ordersByStatus: Record<string, number> = {};
  (orderStatusRes.data || []).forEach((o) => {
    const s = o.status || "pending";
    ordersByStatus[s] = (ordersByStatus[s] || 0) + 1;
  });

  // Revenue by month (last 6 months) — only from recent paid orders
  const recentOrders = recentOrdersRes.data || [];
  const revenueByMonth: { month: string; revenue: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    const monthOrders = recentOrders.filter((o) => {
      const od = new Date(o.created_at);
      return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
    });
    revenueByMonth.push({ month: label, revenue: monthOrders.reduce((s, o) => s + (o.total || 0), 0) });
  }

  return {
    totalGMV,
    platformRevenue,
    totalEvents: eventsCountRes.count || 0,
    totalUsers: usersCountRes.count || 0,
    totalOrders: ordersCountRes.count || 0,
    ticketsSold,
    eventsByStatus,
    ordersByStatus,
    revenueByMonth,
  };
}

// ============================================================
// ADMIN — EVENTS
// ============================================================

export async function getAllEvents(filters?: { status?: string; search?: string }) {
  let query = supabase.from("events").select("id, title, status, start_date, is_featured, platform_fee_percent, created_at, profiles!events_producer_id_fkey(full_name)").order("created_at", { ascending: false }).limit(100);
  if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters?.search) query = query.ilike("title", `%${filters.search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function adminUpdateEvent(eventId: string, updates: Record<string, any>) {
  const { data, error } = await supabase.from("events").update(updates).eq("id", eventId).select().single();
  if (error) throw error;
  return data;
}

// ============================================================
// ADMIN — USERS
// ============================================================

export async function getAllUsers(search?: string) {
  let query = supabase.from("profiles").select("id, full_name, cpf, phone, created_at, user_roles(role)").order("created_at", { ascending: false }).limit(100);
  if (search) query = query.ilike("full_name", `%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ============================================================
// ADMIN — PRODUCERS
// ============================================================

export async function getProducers(statusFilter?: string) {
  let query = supabase
    .from("profiles")
    .select("id, full_name, phone, created_at, producer_status, user_roles!inner(role)")
    .eq("user_roles.role", "producer" as any)
    .order("created_at", { ascending: false })
    .limit(100);
  if (statusFilter && statusFilter !== "all") query = query.eq("producer_status", statusFilter as any);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateProducerStatus(userId: string, status: string) {
  const { data, error } = await supabase.from("profiles").update({ producer_status: status as any }).eq("id", userId).select().single();
  if (error) throw error;
  return data;
}

// ============================================================
// ADMIN — ORDERS
// ============================================================

export async function getAllOrders(filters?: { status?: string; search?: string }) {
  let query = supabase
    .from("orders")
    .select("id, status, total, payment_method, created_at, events(title), profiles!orders_buyer_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters?.search) query = query.ilike("id", `%${filters.search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ============================================================
// ADMIN — FINANCE
// ============================================================

export async function getFinanceData() {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("total, platform_fee, payment_gateway_fee, payment_method")
    .eq("status", "paid");
  if (error) throw error;

  const totalGMV = orders?.reduce((s, o) => s + (o.total || 0), 0) || 0;
  const totalPlatformFee = orders?.reduce((s, o) => s + (o.platform_fee || 0), 0) || 0;
  const totalGatewayFee = orders?.reduce((s, o) => s + (o.payment_gateway_fee || 0), 0) || 0;

  const byMethod: Record<string, { count: number; total: number }> = {};
  orders?.forEach((o) => {
    const m = o.payment_method || "outro";
    if (!byMethod[m]) byMethod[m] = { count: 0, total: 0 };
    byMethod[m].count++;
    byMethod[m].total += o.total || 0;
  });

  return { totalGMV, totalPlatformFee, totalGatewayFee, netRevenue: totalPlatformFee - totalGatewayFee, byMethod, orderCount: orders?.length || 0 };
}
