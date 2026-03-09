import { supabase } from "@/integrations/supabase/client";

// ============================================================
// ADMIN — DASHBOARD
// ============================================================

export async function getAdminDashboardStats(dateRange?: { from: string; to: string }) {
  const fromDate = dateRange?.from;
  const toDate = dateRange?.to;

  // Build date-filtered queries
  let eventsQuery = supabase.from("events").select("id", { count: "exact", head: true });
  let ordersCountQuery = supabase.from("orders").select("id", { count: "exact", head: true });
  let eventStatusQuery = supabase.from("events").select("status");
  let orderStatusQuery = supabase.from("orders").select("status");
  let revenueQuery = supabase.from("orders").select("total, created_at, payment_method").eq("status", "paid");

  if (fromDate) {
    eventsQuery = eventsQuery.gte("created_at", fromDate);
    ordersCountQuery = ordersCountQuery.gte("created_at", fromDate);
    eventStatusQuery = eventStatusQuery.gte("created_at", fromDate);
    orderStatusQuery = orderStatusQuery.gte("created_at", fromDate);
    revenueQuery = revenueQuery.gte("created_at", fromDate);
  }
  if (toDate) {
    eventsQuery = eventsQuery.lte("created_at", toDate);
    ordersCountQuery = ordersCountQuery.lte("created_at", toDate);
    eventStatusQuery = eventStatusQuery.lte("created_at", toDate);
    orderStatusQuery = orderStatusQuery.lte("created_at", toDate);
    revenueQuery = revenueQuery.lte("created_at", toDate);
  }

  const [eventsCountRes, ordersCountRes, usersCountRes, analyticsRes, eventStatusRes, orderStatusRes, revenueOrdersRes] = await Promise.all([
    eventsQuery,
    ordersCountQuery,
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("event_analytics").select("total_revenue, platform_revenue, tickets_sold"),
    eventStatusQuery,
    orderStatusQuery,
    revenueQuery,
  ]);

  const analytics = analyticsRes.data || [];
  const totalGMV = analytics.reduce((s, a) => s + (a.total_revenue || 0), 0);
  const platformRevenue = analytics.reduce((s, a) => s + (a.platform_revenue || 0), 0);
  const ticketsSold = analytics.reduce((s, a) => s + (a.tickets_sold || 0), 0);

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

  // Group revenue by month
  const revenueOrders = revenueOrdersRes.data || [];
  const monthMap: Record<string, number> = {};
  revenueOrders.forEach((o) => {
    const d = new Date(o.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap[key] = (monthMap[key] || 0) + (o.total || 0);
  });

  const sortedMonths = Object.keys(monthMap).sort();
  const revenueByMonth = sortedMonths.map((key) => {
    const [y, m] = key.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    return {
      month: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      revenue: monthMap[key],
    };
  });

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
  let query = supabase.from("events").select("id, title, status, start_date, is_featured, platform_fee_percent, created_at, profiles!events_producer_id_fkey(full_name)").order("created_at", { ascending: false });
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
  let query = supabase.from("profiles").select("id, full_name, cpf, phone, created_at").order("created_at", { ascending: false });
  if (search) query = query.ilike("full_name", `%${search}%`);
  const { data: profiles, error } = await query;
  if (error) throw error;
  if (!profiles || profiles.length === 0) return [];

  // Fetch roles separately (user_roles has no FK to profiles)
  const userIds = profiles.map((p) => p.id);
  const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("user_id", userIds);

  const roleMap = new Map<string, string>();
  (roles || []).forEach((r: any) => roleMap.set(r.user_id, r.role));

  return profiles.map((p) => ({ ...p, role: roleMap.get(p.id) || "buyer" }));
}

// ============================================================
// ADMIN — PRODUCERS
// ============================================================

export async function getProducers(search?: string) {
  // Get all users with producer role
  const { data: producerRoles, error: rolesError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "producer" as any);
  if (rolesError) throw rolesError;
  if (!producerRoles || producerRoles.length === 0) return [];

  const producerIds = producerRoles.map((r: any) => r.user_id);

  let query = supabase
    .from("profiles")
    .select("id, full_name, phone, created_at")
    .in("id", producerIds)
    .order("created_at", { ascending: false });

  if (search) query = query.ilike("full_name", `%${search}%`);

  const { data: profiles, error } = await query;
  if (error) throw error;
  if (!profiles) return [];

  // Count events per producer
  const { data: events } = await supabase
    .from("events")
    .select("producer_id")
    .in("producer_id", producerIds);

  const countMap = new Map<string, number>();
  (events || []).forEach((e: any) => {
    countMap.set(e.producer_id, (countMap.get(e.producer_id) || 0) + 1);
  });

  return profiles.map((p) => ({ ...p, events_count: countMap.get(p.id) || 0 }));
}

export async function getPendingProducers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, cpf, created_at, producer_status")
    .eq("producer_status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getProducerDetail(producerId: string) {
  const [profileRes, eventsRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, phone, created_at").eq("id", producerId).single(),
    supabase.from("events").select("id, title, status, start_date, created_at").eq("producer_id", producerId).order("created_at", { ascending: false }),
  ]);
  if (profileRes.error) throw profileRes.error;
  return { profile: profileRes.data, events: eventsRes.data || [] };
}

export async function updateProducerStatus(userId: string, status: string) {
  const { data, error } = await supabase.from("profiles").update({ producer_status: status as any }).eq("id", userId).select().single();
  if (error) throw error;
  return data;
}

export async function approveProducer(producerId: string) {
  const { data, error } = await supabase.functions.invoke("create-producer-account", {
    body: { producerId },
  });
  if (error) throw error;
  return data;
}

export async function rejectProducer(producerId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ producer_status: "rejected" as any })
    .eq("id", producerId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adminDeleteEvent(eventId: string) {
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw error;
}

// ============================================================
// ADMIN — ORDERS
// ============================================================

export async function getAllOrders(filters?: { status?: string; search?: string }) {
  let query = supabase
    .from("orders")
    .select("id, status, total, payment_method, created_at, events(title), profiles!orders_buyer_id_fkey(full_name)")
    .order("created_at", { ascending: false });
  if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters?.search) query = query.ilike("id", `%${filters.search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ============================================================
// ADMIN — FINANCE
// ============================================================

export async function getFinanceData(dateRange?: { from: string; to: string }) {
  let query = supabase
    .from("orders")
    .select("total, platform_fee, payment_gateway_fee, payment_method")
    .eq("status", "paid");

  if (dateRange?.from) query = query.gte("created_at", dateRange.from);
  if (dateRange?.to) query = query.lte("created_at", dateRange.to);

  const { data: orders, error } = await query;
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
