import { supabase } from "@/integrations/supabase/client";

const TIME_ZONE = "America/Sao_Paulo";

type DashboardDateRange = { from?: string; to?: string; eventId?: string };
type TimelineGranularity = "day" | "month";

type TimelinePoint = {
  label: string;
  revenue: number;
  orders: number;
  ticketsSold: number;
  newEvents: number;
  newUsers: number;
  activeUsers: number;
  checkins: number;
};

type ActivityItem = {
  id: string;
  kind: string;
  title: string;
  detail: string;
  createdAt: string;
  tone: "primary" | "accent" | "warning" | "muted";
};

type TopEventItem = {
  id: string;
  title: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  venue_city: string | null;
  cover_image_url: string | null;
  max_capacity: number | null;
  views_count: number | null;
  page_views: number;
  tickets_sold: number;
  tickets_checked_in: number;
  total_revenue: number;
  platform_revenue: number;
  producer_revenue: number;
  conversion_rate: number;
  occupancy_rate: number;
  featured: boolean;
};

const orderStatusLabels: Record<string, string> = {
  pending: "Pendente",
  processing: "Processando",
  paid: "Pago",
  cancelled: "Cancelado",
  refunded: "Estornado",
  expired: "Expirado",
};

function getOrderStatusLabel(status: string) {
  return orderStatusLabels[status] || status;
}

function isWithinRange(value: string | null | undefined, from?: string, to?: string) {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return false;
  if (from && timestamp < new Date(from).getTime()) return false;
  if (to && timestamp > new Date(to).getTime()) return false;
  return true;
}

function getBucketInfo(value: string, granularity: TimelineGranularity) {
  const date = new Date(value);
  const sortKey = granularity === "month"
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const label = granularity === "month"
    ? date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: TIME_ZONE })
    : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: TIME_ZONE });

  return { sortKey, label };
}

function createEmptyTimelinePoint(label: string): TimelinePoint {
  return {
    label,
    revenue: 0,
    orders: 0,
    ticketsSold: 0,
    newEvents: 0,
    newUsers: 0,
    activeUsers: 0,
    checkins: 0,
  };
}

function buildTimelineSeries(
  rows: {
    events: any[];
    orders: any[];
    tickets: any[];
    profiles: any[];
    checkins: any[];
  },
  granularity: TimelineGranularity,
  dateRange?: DashboardDateRange,
) {
  const buckets = new Map<string, TimelinePoint & { sortKey: string }>();
  const activeUsersByBucket = new Map<string, Set<string>>();
  const activeUsersOverall = new Set<string>();

  const ensureBucket = (dateValue: string) => {
    const { sortKey, label } = getBucketInfo(dateValue, granularity);
    if (!buckets.has(sortKey)) {
      buckets.set(sortKey, { sortKey, ...createEmptyTimelinePoint(label) });
    }
    return buckets.get(sortKey)!;
  };

  const registerActiveUser = (dateValue: string | null | undefined, userId?: string | null) => {
    if (!dateValue || !userId || !isWithinRange(dateValue, dateRange?.from, dateRange?.to)) return;
    const { sortKey, label } = getBucketInfo(dateValue, granularity);
    const bucket = ensureBucket(dateValue);
    bucket.label = label;
    let set = activeUsersByBucket.get(sortKey);
    if (!set) {
      set = new Set<string>();
      activeUsersByBucket.set(sortKey, set);
    }
    set.add(userId);
    activeUsersOverall.add(userId);
  };

  rows.events.forEach((event) => {
    if (!isWithinRange(event.created_at, dateRange?.from, dateRange?.to)) return;
    const bucket = ensureBucket(event.created_at);
    bucket.newEvents += 1;
  });

  rows.profiles.forEach((profile) => {
    if (isWithinRange(profile.created_at, dateRange?.from, dateRange?.to)) {
      const bucket = ensureBucket(profile.created_at);
      bucket.newUsers += 1;
      registerActiveUser(profile.created_at, profile.id);
    }
    if (isWithinRange(profile.updated_at, dateRange?.from, dateRange?.to)) {
      registerActiveUser(profile.updated_at, profile.id);
    }
  });

  rows.orders.forEach((order) => {
    if (!isWithinRange(order.created_at, dateRange?.from, dateRange?.to)) return;
    const bucket = ensureBucket(order.created_at);
    bucket.orders += 1;
    if (order.status === "paid") {
      bucket.revenue += Number(order.total || 0);
    }
    registerActiveUser(order.created_at, order.buyer_id);
  });

  rows.tickets.forEach((ticket) => {
    if (!isWithinRange(ticket.created_at, dateRange?.from, dateRange?.to)) return;
    const bucket = ensureBucket(ticket.created_at);
    bucket.ticketsSold += 1;
    registerActiveUser(ticket.created_at, ticket.owner_id);
  });

  rows.checkins.forEach((session) => {
    if (!isWithinRange(session.created_at, dateRange?.from, dateRange?.to)) return;
    const bucket = ensureBucket(session.created_at);
    bucket.checkins += 1;
    registerActiveUser(session.created_at, session.operator_id);
  });

  activeUsersByBucket.forEach((set, sortKey) => {
    const bucket = buckets.get(sortKey);
    if (bucket) bucket.activeUsers = set.size;
  });

  return Array.from(buckets.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ sortKey, ...bucket }) => bucket);
}

function buildRecentActivity(params: {
  events: any[];
  orders: any[];
  tickets: any[];
  checkins: any[];
  profiles: any[];
}) {
  const items: ActivityItem[] = [];

  params.events.slice(0, 8).forEach((event) => {
    if (!event.created_at) return;
    items.push({
      id: `event:${event.id}`,
      kind: "event",
      title: event.status === "published" ? "Evento publicado" : "Evento criado",
      detail: `${event.title || "Evento"}${event.venue_city ? ` · ${event.venue_city}` : ""}`,
      createdAt: event.created_at,
      tone: event.status === "published" ? "primary" : "warning",
    });
  });

  params.orders.slice(0, 10).forEach((order) => {
    if (!order.created_at) return;
    const buyer = (order.profiles as any)?.full_name || "Cliente";
    const eventTitle = (order.events as any)?.title || "Evento";
    items.push({
      id: `order:${order.id}`,
      kind: "order",
      title: order.status === "paid" ? "Pedido pago" : `Pedido ${getOrderStatusLabel(order.status)}`,
      detail: `${buyer} · ${eventTitle}`,
      createdAt: order.created_at,
      tone: order.status === "paid" ? "primary" : order.status === "cancelled" || order.status === "expired" ? "warning" : "muted",
    });
  });

  params.tickets.slice(0, 10).forEach((ticket) => {
    if (!ticket.created_at) return;
    const owner = (ticket.profiles as any)?.full_name || "Titular";
    const eventTitle = (ticket.events as any)?.title || "Evento";
    items.push({
      id: `ticket:${ticket.id}`,
      kind: "ticket",
      title: ticket.checked_in_at ? "Ingresso validado" : "Ingresso emitido",
      detail: `${owner} · ${eventTitle}`,
      createdAt: ticket.created_at,
      tone: ticket.checked_in_at ? "accent" : "primary",
    });
  });

  params.checkins.slice(0, 10).forEach((session) => {
    if (!session.created_at) return;
    const operator = (session.profiles as any)?.full_name || "Operador";
    const eventTitle = (session.events as any)?.title || "Evento";
    items.push({
      id: `checkin:${session.id}`,
      kind: "checkin",
      title: "Sessão de check-in",
      detail: `${operator} · ${eventTitle}`,
      createdAt: session.created_at,
      tone: "accent",
    });
  });

  params.profiles.slice(0, 10).forEach((profile) => {
    if (!profile.created_at) return;
    items.push({
      id: `profile:${profile.id}`,
      kind: "user",
      title: "Novo usuário",
      detail: profile.full_name || "Usuário sem nome",
      createdAt: profile.created_at,
      tone: "muted",
    });
  });

  return items
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);
}

function buildTopEvents(analyticsRows: any[]): TopEventItem[] {
  return analyticsRows
    .map((row) => {
      const event = row.events || {};
      const ticketsSold = Number(row.tickets_sold || 0);
      const checkedIn = Number(row.tickets_checked_in || 0);
      const pageViews = Number(row.page_views || event.views_count || 0);
      const totalRevenue = Number(row.total_revenue || 0);
      const platformRevenue = Number(row.platform_revenue || 0);
      const producerRevenue = Number(row.producer_revenue || 0);
      const capacity = Number(event.max_capacity || 0);
      const occupancyRate = capacity > 0 ? (ticketsSold / capacity) * 100 : 0;
      const conversionRate = Number(row.conversion_rate || (pageViews > 0 ? (ticketsSold / pageViews) * 100 : 0));

      return {
        id: row.event_id,
        title: event.title || "Evento",
        status: event.status || "draft",
        start_date: event.start_date || null,
        end_date: event.end_date || null,
        venue_city: event.venue_city || null,
        cover_image_url: event.cover_image_url || null,
        max_capacity: event.max_capacity ?? null,
        views_count: event.views_count ?? null,
        page_views: pageViews,
        tickets_sold: ticketsSold,
        tickets_checked_in: checkedIn,
        total_revenue: totalRevenue,
        platform_revenue: platformRevenue,
        producer_revenue: producerRevenue,
        conversion_rate: conversionRate,
        occupancy_rate: occupancyRate,
        featured: Boolean(event.is_featured),
      };
    })
    .sort((a, b) => b.total_revenue - a.total_revenue || b.tickets_sold - a.tickets_sold || b.page_views - a.page_views);
}

// ============================================================
// ADMIN — DASHBOARD
// ============================================================

export async function getAdminDashboardStats(dateRange?: DashboardDateRange) {
  const fromDate = dateRange?.from;
  const toDate = dateRange?.to;
  const eventId = dateRange?.eventId;

  let eventsQuery = supabase
    .from("events")
    .select("id, title, status, created_at, start_date, end_date, venue_city, cover_image_url, max_capacity, views_count, is_featured, platform_fee_percent", { count: "exact" })
    .order("created_at", { ascending: false });

  let ordersQuery = supabase
    .from("orders")
    .select("id, status, total, platform_fee, created_at, payment_method, buyer_id, event_id, profiles!orders_buyer_id_fkey(full_name, avatar_url), events(id, title, venue_city, cover_image_url)", { count: "exact" })
    .order("created_at", { ascending: false });

  let ticketsQuery = supabase
    .from("tickets")
    .select("id, created_at, owner_id, event_id, status, checked_in_at, profiles!tickets_owner_id_fkey(full_name, avatar_url), events(id, title, venue_city, cover_image_url)", { count: "exact" })
    .in("status", ["active", "used"])
    .order("created_at", { ascending: false });

  const profilesQuery = supabase
    .from("profiles")
    .select("id, full_name, created_at, updated_at, avatar_url", { count: "exact" })
    .order("created_at", { ascending: false });

  let checkinsQuery = supabase
    .from("checkin_sessions")
    .select("id, created_at, operator_id, event_id, profiles!checkin_sessions_operator_id_fkey(full_name, avatar_url), events(title, venue_city)", { count: "exact" })
    .order("created_at", { ascending: false });

  let analyticsQuery = supabase
    .from("event_analytics")
    .select("event_id, total_revenue, platform_revenue, producer_revenue, tickets_sold, tickets_checked_in, page_views, conversion_rate, events(id, title, status, start_date, end_date, venue_city, cover_image_url, max_capacity, views_count, is_featured, platform_fee_percent, created_at)", { count: "exact" });

  if (eventId) {
    eventsQuery = eventsQuery.eq("id", eventId);
    ordersQuery = ordersQuery.eq("event_id", eventId);
    ticketsQuery = ticketsQuery.eq("event_id", eventId);
    checkinsQuery = checkinsQuery.eq("event_id", eventId);
    analyticsQuery = analyticsQuery.eq("event_id", eventId);
  } else {
    if (fromDate) {
      eventsQuery = eventsQuery.gte("created_at", fromDate);
    }
    if (toDate) {
      eventsQuery = eventsQuery.lte("created_at", toDate);
    }
  }

  if (fromDate) {
    ordersQuery = ordersQuery.gte("created_at", fromDate);
    ticketsQuery = ticketsQuery.gte("created_at", fromDate);
    checkinsQuery = checkinsQuery.gte("created_at", fromDate);
  }
  if (toDate) {
    ordersQuery = ordersQuery.lte("created_at", toDate);
    ticketsQuery = ticketsQuery.lte("created_at", toDate);
    checkinsQuery = checkinsQuery.lte("created_at", toDate);
  }

  const [eventsRes, ordersRes, ticketsRes, profilesRes, checkinsRes, analyticsRes] = await Promise.all([
    eventsQuery,
    ordersQuery,
    ticketsQuery,
    profilesQuery,
    checkinsQuery,
    analyticsQuery,
  ]);

  if (eventsRes.error) throw eventsRes.error;
  if (ordersRes.error) throw ordersRes.error;
  if (ticketsRes.error) throw ticketsRes.error;
  if (profilesRes.error) throw profilesRes.error;
  if (checkinsRes.error) throw checkinsRes.error;
  if (analyticsRes.error) throw analyticsRes.error;

  const events = eventsRes.data || [];
  const orders = ordersRes.data || [];
  const tickets = ticketsRes.data || [];
  const profiles = profilesRes.data || [];
  const checkins = checkinsRes.data || [];
  const analytics = analyticsRes.data || [];

  const paidOrders = orders.filter((o: any) => o.status === "paid");
  const totalGMV = paidOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);
  const platformRevenue = paidOrders.reduce((sum: number, order: any) => sum + Number(order.platform_fee || 0), 0);
  const ticketsSold = tickets.length;
  const totalPageViews = analytics.reduce((sum: number, row: any) => sum + Number(row.page_views || row.events?.views_count || 0), 0);
  const totalCheckedIn = analytics.reduce((sum: number, row: any) => sum + Number(row.tickets_checked_in || 0), 0);
  const activeUsers = new Set<string>();

  profiles.forEach((profile: any) => {
    if (isWithinRange(profile.created_at, fromDate, toDate)) activeUsers.add(profile.id);
    if (isWithinRange(profile.updated_at, fromDate, toDate)) activeUsers.add(profile.id);
  });
  orders.forEach((order: any) => {
    if (isWithinRange(order.created_at, fromDate, toDate) && order.buyer_id) activeUsers.add(order.buyer_id);
  });
  tickets.forEach((ticket: any) => {
    if (isWithinRange(ticket.created_at, fromDate, toDate) && ticket.owner_id) activeUsers.add(ticket.owner_id);
  });
  checkins.forEach((session: any) => {
    if (isWithinRange(session.created_at, fromDate, toDate) && session.operator_id) activeUsers.add(session.operator_id);
  });

  const eventsByStatus: Record<string, number> = {};
  events.forEach((event: any) => {
    const status = event.status || "draft";
    eventsByStatus[status] = (eventsByStatus[status] || 0) + 1;
  });

  const ordersByStatus: Record<string, number> = {};
  orders.forEach((order: any) => {
    const status = order.status || "pending";
    ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
  });

  const paymentMethodMap: Record<string, { count: number; total: number }> = {};
  paidOrders.forEach((order: any) => {
    const method = order.payment_method || "outro";
    if (!paymentMethodMap[method]) paymentMethodMap[method] = { count: 0, total: 0 };
    paymentMethodMap[method].count += 1;
    paymentMethodMap[method].total += Number(order.total || 0);
  });

  const timelineByMonth = buildTimelineSeries({ events, orders, tickets, profiles, checkins }, "month", dateRange);
  const timelineByDay = buildTimelineSeries({ events, orders, tickets, profiles, checkins }, "day", dateRange);

  const revenueByMonth = timelineByMonth.map((point) => ({ month: point.label, revenue: point.revenue }));
  const revenueByDay = timelineByDay.map((point) => ({ day: point.label, revenue: point.revenue }));

  const totalUsers = eventId
    ? new Set([
        ...orders.map((order: any) => order.buyer_id),
        ...tickets.map((ticket: any) => ticket.owner_id),
        ...checkins.map((session: any) => session.operator_id),
      ].filter(Boolean)).size
    : profiles.length;

  const newEvents = events.filter((event: any) => isWithinRange(event.created_at, fromDate, toDate)).length;
  const newUsers = profiles.filter((profile: any) => isWithinRange(profile.created_at, fromDate, toDate)).length;

  const topEvents = buildTopEvents(analytics);
  const recentActivity = buildRecentActivity({ events, orders, tickets, checkins, profiles });

  const publishedEvents = events.filter((event: any) => event.status === "published").length;
  const draftEvents = events.filter((event: any) => event.status === "draft").length;
  const endedEvents = events.filter((event: any) => ["ended", "completed", "finished", "done"].includes(event.status)).length;

  return {
    totalGMV,
    platformRevenue,
    totalEvents: events.length,
    totalUsers,
    totalOrders: orders.length,
    ticketsSold,
    totalPageViews,
    totalCheckedIn,
    activeUsers: activeUsers.size,
    newEvents,
    newUsers,
    publishedEvents,
    draftEvents,
    endedEvents,
    eventsByStatus,
    ordersByStatus,
    timelineByMonth,
    timelineByDay,
    revenueByMonth,
    revenueByDay,
    paymentMethodMap,
    topEvents,
    recentActivity,
  };
}

// ============================================================
// ADMIN — EVENTS
// ============================================================

function applyEventStatusFilter(query: any, status?: string) {
  if (!status || status === "all") return query;

  if (status === "ended") {
    const nowIso = new Date().toISOString();
    return query.in("status", ["published", "ended", "completed", "finished", "done"]).lte("end_date", nowIso);
  }

  return query.eq("status", status);
}

export async function getAllEvents(filters?: { status?: string; search?: string }) {
  let query = supabase
    .from("events")
    .select("id, title, slug, status, category, start_date, end_date, venue_city, cover_image_url, is_featured, platform_fee_percent, created_at, profiles!events_producer_id_fkey(full_name)")
    .order("created_at", { ascending: false });
  query = applyEventStatusFilter(query, filters?.status);
  if (filters?.search) query = query.ilike("title", `%${filters.search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getAllEventsPaginated(
  filters?: { status?: string; search?: string; sortBy?: "recent" | "soonest" | "featured" | "highest_fee" | "lowest_fee" },
  range?: { from: number; to: number }
) {
  let query = supabase
    .from("events")
    .select("id, title, slug, status, category, start_date, end_date, venue_city, producer_id, created_at, cover_image_url, is_featured, platform_fee_percent, profiles!events_producer_id_fkey(full_name)", { count: "exact" })
  if (filters?.sortBy === "soonest") {
    query = query.order("start_date", { ascending: true }).order("created_at", { ascending: false });
  } else if (filters?.sortBy === "featured") {
    query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
  } else if (filters?.sortBy === "highest_fee") {
    query = query.order("platform_fee_percent", { ascending: false }).order("created_at", { ascending: false });
  } else if (filters?.sortBy === "lowest_fee") {
    query = query.order("platform_fee_percent", { ascending: true }).order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = applyEventStatusFilter(query, filters?.status);
  if (filters?.search) {
    const safeSearch = filters.search.replace(/[%_]/g, "");
    query = query.or(`title.ilike.%${safeSearch}%,slug.ilike.%${safeSearch}%,venue_city.ilike.%${safeSearch}%`);
  }
  if (range) query = query.range(range.from, range.to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count ?? 0 };
}

export async function adminUpdateEvent(eventId: string, updates: Record<string, any>) {
  const { data, error } = await supabase.from("events").update(updates).eq("id", eventId).select().single();
  if (error) throw error;
  return data;
}

// ============================================================
// ADMIN — USERS
// ============================================================

export async function getAllUsersPaginated(
  filters?: { role?: string; search?: string },
  range?: { from: number; to: number }
) {
  let query = supabase
    .from("profiles")
    .select("id, full_name, cpf, phone, avatar_url, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters?.search) {
    const safeSearch = filters.search.replace(/[%_]/g, "");
    query = query.or(`full_name.ilike.%${safeSearch}%,cpf.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%`);
  }
  if (range) query = query.range(range.from, range.to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count ?? 0 };
}

export async function getAllUsers(search?: string) {
  let query = supabase.from("profiles").select("id, full_name, cpf, phone, created_at").order("created_at", { ascending: false });
  if (search) {
    const safeSearch = search.replace(/[%_]/g, "");
    query = query.or(`full_name.ilike.%${safeSearch}%,cpf.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%`);
  }
  const { data: profiles, error } = await query;
  if (error) throw error;
  if (!profiles || profiles.length === 0) return [];

  // Fetch roles separately (user_roles has no FK to profiles)
  const userIds = profiles.map((p) => p.id);
  const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("user_id", userIds);

  const roleMap = new Map<string, string[]>();
  (roles || []).forEach((r: any) => {
    const existing = roleMap.get(r.user_id) || [];
    existing.push(r.role);
    roleMap.set(r.user_id, existing);
  });

  return profiles.map((p) => ({ ...p, roles: roleMap.get(p.id) || ["buyer"] }));
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

export async function getProducerDetail(producerId: string) {
  const [profileRes, eventsRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, phone, created_at, producer_status").eq("id", producerId).single(),
    supabase.from("events").select("id, title, status, start_date, created_at").eq("producer_id", producerId).order("created_at", { ascending: false }),
  ]);
  if (profileRes.error) throw profileRes.error;
  return { profile: profileRes.data, events: eventsRes.data || [] };
}

function getFunctionStatus(error: unknown) {
  if (!error || typeof error !== "object") return undefined;

  const context = (error as { context?: unknown }).context;
  if (context && typeof context === "object" && "status" in context && typeof (context as { status?: unknown }).status === "number") {
    return (context as { status: number }).status;
  }

  if ("status" in error && typeof (error as { status?: unknown }).status === "number") {
    return (error as { status: number }).status;
  }

  return undefined;
}

export async function adminDeleteEvent(eventId: string) {
  const { error: edgeError } = await supabase.functions.invoke("admin-force-delete-event", {
    body: { eventId },
  });

  if (!edgeError) return;

  const status = getFunctionStatus(edgeError);
  if (status === 404) {
    const { error: rpcError } = await supabase.rpc("admin_force_delete_event", { p_event_id: eventId });
    if (!rpcError) return;
    throw rpcError;
  }

  throw edgeError instanceof Error ? edgeError : new Error("Erro ao remover evento");
}

// ============================================================
// ADMIN — ORDERS
// ============================================================

export async function getAllOrdersPaginated(
  filters?: { status?: string; search?: string; eventId?: string; sortBy?: "recent" | "oldest" | "highest_total" | "lowest_total" },
  range?: { from: number; to: number }
) {
  let query = supabase
    .from("orders")
    .select("id, status, total, platform_fee, payment_method, created_at, buyer_id, event_id, events(id, title, slug, cover_image_url, venue_city), profiles!orders_buyer_id_fkey(full_name, avatar_url)", { count: "exact" });

  const orderColumn = filters?.sortBy === "highest_total" || filters?.sortBy === "lowest_total" ? "total" : "created_at";
  const ascending = filters?.sortBy === "oldest" || filters?.sortBy === "lowest_total";
  query = query.order(orderColumn, { ascending });

  if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters?.eventId) query = query.eq("event_id", filters.eventId);
  if (filters?.search) {
    const safeSearch = filters.search.replace(/[%_]/g, "");
    query = query.ilike("id", `%${safeSearch}%`);
  }
  if (range) query = query.range(range.from, range.to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count ?? 0 };
}

export async function getAllOrders(filters?: { status?: string; search?: string }) {
  let query = supabase
    .from("orders")
    .select("id, status, total, platform_fee, payment_method, created_at, buyer_id, event_id, events(id, title, slug, cover_image_url, venue_city), profiles!orders_buyer_id_fkey(full_name, avatar_url)")
    .order("created_at", { ascending: false });
  if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
  const { data, error } = await query;
  if (error) throw error;

  // Client-side search — Supabase doesn't support .or() across joined tables easily
  if (filters?.search && data) {
    const q = filters.search.toLowerCase();
    return data.filter((o: any) =>
      (o.profiles?.full_name || "").toLowerCase().includes(q) ||
      (o.events?.title || "").toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    );
  }
  return data;
}

// ============================================================
// ADMIN — FINANCE
// ============================================================

export async function getFinanceData(dateRange?: { from?: string; to?: string; eventId?: string }) {
  let query = supabase
    .from("orders")
    .select("total, platform_fee, payment_gateway_fee, payment_method")
    .eq("status", "paid");

  if (dateRange?.from) query = query.gte("created_at", dateRange.from);
  if (dateRange?.to) query = query.lte("created_at", dateRange.to);
  if (dateRange?.eventId) query = query.eq("event_id", dateRange.eventId);

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
