import { supabase } from "@/integrations/supabase/client";

// ============================================================
// PRODUCER — EVENTS
// ============================================================

export async function getProducerEvents(producerId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*, ticket_tiers(id, name, price, quantity_total, quantity_sold)")
    .eq("producer_id", producerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}


const missingEventColumns = new Set<string>();

type StripResult = { payload: Record<string, any>; removedField: string } | null;

function stripUnknownColumnError(error: any, payload: Record<string, any>): StripResult {
  const message: string = error?.message || "";
  const match = message.match(/Could not find the '(.+?)' column/);
  if (!match) return null;
  const field = match[1];
  if (!(field in payload)) return null;
  const { [field]: _, ...rest } = payload;
  return { payload: rest, removedField: field };
}

function removeKnownMissingColumns(payload: Record<string, any>) {
  const result = { ...payload };
  for (const col of missingEventColumns) {
    delete (result as any)[col];
  }
  return result;
}

const MAX_SCHEMA_RETRY = 10;

const TIME_ZONE = "America/Sao_Paulo";
const PRODUCER_TREND_DAYS = 30;

type TimelineGranularity = "day" | "month";

type ProducerTimelinePoint = {
  label: string;
  revenue: number;
  orders: number;
  ticketsSold: number;
  checkins: number;
};

type ProducerTimelineBucket = ProducerTimelinePoint & { sortKey: string };

function formatPercent(value: number) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function isOrderPaid(order: any) {
  const status = String(order?.status || "").trim().toLowerCase();
  const paymentStatus = String(order?.payment_status || "").trim().toLowerCase();

  return status === "paid"
    || status === "confirmed"
    || ["paid", "confirmed", "received", "approved"].includes(paymentStatus);
}

function dedupeOrders(orders: any[]) {
  const uniqueOrders = new Map<string, any>();
  for (const order of orders) {
    if (!order?.id) continue;
    if (!uniqueOrders.has(order.id)) {
      uniqueOrders.set(order.id, order);
    }
  }
  return Array.from(uniqueOrders.values());
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

function createEmptyProducerTimelinePoint(label: string): ProducerTimelinePoint {
  return {
    label,
    revenue: 0,
    orders: 0,
    ticketsSold: 0,
    checkins: 0,
  };
}

function buildProducerTimelineSeries(
  rows: { orders: any[]; tickets: any[] },
  granularity: TimelineGranularity,
) {
  const now = new Date();
  const cutoff = new Date(now);
  if (granularity === "month") {
    cutoff.setDate(1);
    cutoff.setMonth(cutoff.getMonth() - 11);
  } else {
    cutoff.setDate(cutoff.getDate() - (PRODUCER_TREND_DAYS - 1));
  }
  cutoff.setHours(0, 0, 0, 0);

  const buckets = new Map<string, ProducerTimelineBucket>();

  const seedBucket = (dateValue: Date) => {
    const { sortKey, label } = getBucketInfo(dateValue.toISOString(), granularity);
    if (!buckets.has(sortKey)) {
      buckets.set(sortKey, { sortKey, ...createEmptyProducerTimelinePoint(label) });
    }
  };

  const cursor = new Date(cutoff);
  if (granularity === "month") {
    cursor.setDate(1);
    while (cursor <= now) {
      seedBucket(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else {
    while (cursor <= now) {
      seedBucket(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const ensureBucket = (dateValue: string) => {
    const { sortKey, label } = getBucketInfo(dateValue, granularity);
    if (!buckets.has(sortKey)) {
      buckets.set(sortKey, { sortKey, ...createEmptyProducerTimelinePoint(label) });
    }
    return buckets.get(sortKey)!;
  };

  rows.orders.forEach((order) => {
    if (!order?.created_at) return;
    const createdAt = new Date(order.created_at);
    if (Number.isNaN(createdAt.getTime()) || createdAt.getTime() < cutoff.getTime()) return;

    const bucket = ensureBucket(order.created_at);
    bucket.orders += 1;
    bucket.revenue += Math.max(0, Number(order.total || 0) - Number(order.platform_fee || 0));
  });

  rows.tickets.forEach((ticket) => {
    if (!ticket?.created_at) return;
    const createdAt = new Date(ticket.created_at);
    if (Number.isNaN(createdAt.getTime()) || createdAt.getTime() < cutoff.getTime()) return;

    const bucket = ensureBucket(ticket.created_at);
    bucket.ticketsSold += 1;

    if (ticket.checked_in_at) {
      const checkedInAt = new Date(ticket.checked_in_at);
      if (!Number.isNaN(checkedInAt.getTime()) && checkedInAt.getTime() >= cutoff.getTime()) {
        const checkinBucket = ensureBucket(ticket.checked_in_at);
        checkinBucket.checkins += 1;
      }
    }
  });

  return Array.from(buckets.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ sortKey, ...bucket }) => bucket);
}

export async function createEvent(event: {
  producer_id: string;
  title: string;
  slug: string;
  description?: string;
  category?: string;
  status?: string;
  cover_image_url?: string;
  banner_image_url?: string;
  venue_name?: string;
  venue_address?: string;
  venue_city?: string;
  venue_state?: string;
  venue_zip?: string;
  is_online?: boolean;
  online_url?: string;
  start_date: string;
  end_date: string;
  doors_open_time?: string;
  minimum_age?: number;
  max_capacity?: number;
}) {
  let payload: Record<string, any> = removeKnownMissingColumns({ ...event });
  const removedFields: string[] = [];
  let lastErrorMessage = "";

  for (let i = 0; i < MAX_SCHEMA_RETRY; i++) {
    const { data, error } = await supabase
      .from("events")
      .insert(payload)
      .select()
      .single();

    if (!error) return data;
    lastErrorMessage = error.message;

    const stripped = stripUnknownColumnError(error, payload);
    if (!stripped) {
      const removedInfo = removedFields.length ? ` (removed fields: ${removedFields.join(", ")})` : "";
      throw new Error(`${error.message}${removedInfo}`);
    }

    missingEventColumns.add(stripped.removedField);
    removedFields.push(stripped.removedField);
    payload = stripped.payload;
  }

  throw new Error(
    `Failed to create event due to schema mismatch. Last error: ${lastErrorMessage}. Removed fields: ${removedFields.join(", ")}`,
  );
}

export async function updateEvent(eventId: string, updates: Record<string, any>) {
  let payload = removeKnownMissingColumns({ ...updates });
  const removedFields: string[] = [];
  let lastErrorMessage = "";

  for (let i = 0; i < MAX_SCHEMA_RETRY; i++) {
    const { data, error } = await supabase
      .from("events")
      .update(payload)
      .eq("id", eventId)
      .select()
      .single();

    if (!error) return data;
    lastErrorMessage = error.message;

    const stripped = stripUnknownColumnError(error, payload);
    if (!stripped) {
      const removedInfo = removedFields.length ? ` (removed fields: ${removedFields.join(", ")})` : "";
      throw new Error(`${error.message}${removedInfo}`);
    }

    missingEventColumns.add(stripped.removedField);
    removedFields.push(stripped.removedField);
    payload = stripped.payload;
  }

  throw new Error(
    `Failed to update event due to schema mismatch. Last error: ${lastErrorMessage}. Removed fields: ${removedFields.join(", ")}`,
  );
}

export async function deleteEvent(eventId: string) {
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw error;
}

// ============================================================
// PRODUCER — TICKET TIERS
// ============================================================

export async function createTicketTier(tier: {
  event_id: string;
  name: string;
  tier_type?: string;
  price?: number;
  original_price?: number;
  quantity_total: number;
  sale_start_date?: string;
  sale_end_date?: string;
  description?: string;
  min_per_order?: number;
  max_per_order?: number;
  is_transferable?: boolean;
  is_resellable?: boolean;
  sort_order?: number;
}) {
  const { data, error } = await supabase
    .from("ticket_tiers")
    .insert(tier)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTicketTier(tierId: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("ticket_tiers")
    .update(updates)
    .eq("id", tierId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTicketTier(tierId: string) {
  const { error } = await supabase.from("ticket_tiers").delete().eq("id", tierId);
  if (error) throw error;
}

// ============================================================
// PRODUCER — ORDERS
// ============================================================

export async function getEventOrders(eventId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, profiles!orders_buyer_id_fkey(full_name, cpf)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getEventOrdersPaginated(
  eventId: string,
  filters?: { status?: string; search?: string },
  range?: { from: number; to: number }
) {
  let query = supabase
    .from("orders")
    .select("id, status, total, platform_fee, payment_method, created_at, buyer_id, profiles!orders_buyer_id_fkey(full_name)", { count: "exact" })
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters?.search) {
    const safeSearch = filters.search.replace(/[%_]/g, "");
    query = query.ilike("id", `%${safeSearch}%`);
  }
  if (range) query = query.range(range.from, range.to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count ?? 0 };
}

// ============================================================
// PRODUCER — TICKETS (PAGINATED)
// ============================================================

export async function getEventTicketsPaginated(
  eventId: string,
  filters?: { status?: string; tierId?: string; search?: string },
  range?: { from: number; to: number }
) {
  let query = supabase
    .from("tickets")
    .select("id, status, attendee_name, attendee_email, checked_in_at, created_at, tier_id, owner_id, ticket_tiers(name), profiles!tickets_owner_id_fkey(full_name)", { count: "exact" })
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters?.tierId && filters.tierId !== "all") query = query.eq("tier_id", filters.tierId);
  if (filters?.search) {
    const safeSearch = filters.search.replace(/[%_]/g, "");
    query = query.or(`attendee_name.ilike.%${safeSearch}%,attendee_email.ilike.%${safeSearch}%`);
  }
  if (range) query = query.range(range.from, range.to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count ?? 0 };
}

// ============================================================
// PRODUCER — ANALYTICS
// ============================================================

export async function getEventAnalytics(eventId: string) {
  const { data, error } = await supabase
    .from("event_analytics")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ============================================================
// PRODUCER — CHECKIN
// ============================================================

export async function getEventTickets(eventId: string) {
  const { data, error } = await supabase
    .from("tickets")
    .select("*, ticket_tiers(name), profiles!tickets_owner_id_fkey(full_name), orders(status, payment_status)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function checkinTicket(ticketId: string, operatorId: string) {
  const { data, error } = await supabase
    .from("tickets")
    .update({ status: "used", checked_in_at: new Date().toISOString(), checked_in_by: operatorId })
    .eq("id", ticketId)
    .eq("status", "active")
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// PRODUCER — GUEST LIST
// ============================================================

export async function getEventGuestList(eventId: string) {
  const { data, error } = await supabase
    .from("guest_lists")
    .select("*, ticket_tiers(name)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addGuest(guest: {
  event_id: string;
  name?: string;
  email?: string;
  phone?: string;
  tier_id?: string;
  added_by: string;
}) {
  const { data, error } = await supabase
    .from("guest_lists")
    .insert(guest)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeGuest(guestId: string) {
  const { error } = await supabase.from("guest_lists").delete().eq("id", guestId);
  if (error) throw error;
}

export async function checkinGuest(guestId: string) {
  const { data, error } = await supabase
    .from("guest_lists")
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq("id", guestId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// PRODUCER — COUPONS
// ============================================================

export async function getEventCoupons(eventId: string) {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createCoupon(coupon: {
  event_id: string;
  producer_id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses?: number;
  valid_from?: string;
  valid_until?: string;
  min_order_value?: number;
  applicable_tier_ids?: string[];
}) {
  const { data, error } = await supabase
    .from("coupons")
    .insert(coupon)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCoupon(couponId: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("coupons")
    .update(updates)
    .eq("id", couponId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCoupon(couponId: string) {
  const { error } = await supabase.from("coupons").delete().eq("id", couponId);
  if (error) throw error;
}

// ============================================================
// PRODUCER — DASHBOARD STATS
// ============================================================

export async function getProducerDashboardStats(producerId: string) {
  const { data: memberships } = await supabase
    .from("producer_team_members")
    .select("producer_id")
    .eq("user_id", producerId)
    .eq("status", "active");

  const producerScopeIds = Array.from(new Set([
    producerId,
    ...(memberships || []).map((member) => member.producer_id).filter(Boolean),
  ]));

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, title, status, start_date, end_date, created_at, max_capacity, venue_city, views_count, slug")
    .in("producer_id", producerScopeIds);

  if (eventsError) throw eventsError;

  if (!events || events.length === 0) {
    return {
      totalRevenue: 0,
      grossRevenue: 0,
      netRevenue: 0,
      ticketRevenue: 0,
      platformRevenue: 0,
      gatewayFees: 0,
      refundAmount: 0,
      ticketsSold: 0,
      ticketsCheckedIn: 0,
      pageViews: 0,
      conversionRate: 0,
      checkinRate: 0,
      portfolioOccupancyRate: 0,
      averageOrderValue: 0,
      averageRevenuePerTicket: 0,
      viewsPerTicket: 0,
      totalEvents: 0,
      upcomingEvents: 0,
      activeEvents: 0,
      publishedEvents: 0,
      draftEvents: 0,
      endedEvents: 0,
      soldOutEvents: 0,
      nearSoldOutEvents: 0,
      confirmedOrders: 0,
      ordersLast7DaysCount: 0,
      revenueLast7DaysAmount: 0,
      ordersLast30DaysCount: 0,
      revenueLast30DaysAmount: 0,
      ticketsSoldLast7DaysCount: 0,
      ticketsSoldLast30DaysCount: 0,
      checkinsLast7DaysCount: 0,
      checkinsLast30DaysCount: 0,
      timelineByDay: [],
      timelineByMonth: [],
      focusEvent: null,
      topEvents: [],
      otherUpcomingEvents: [],
      practicalAlerts: [
        {
          id: "first-event",
          severity: "critical",
          title: "Nenhum evento cadastrado",
          description: "Crie seu primeiro evento para começar a acompanhar vendas e desempenho.",
          ctaLabel: "Criar evento",
          ctaTo: "/producer/events/new",
        },
      ],
    };
  }

  const now = new Date();
  const nowMs = now.getTime();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgoMs = sevenDaysAgo.getTime();
  const thirtyDaysAgoMs = thirtyDaysAgo.getTime();
  const nowIso = now.toISOString();

  const sortedForFocus = [...events].sort((a, b) => {
    const statusScore = (status: string | null) => {
      const normalized = String(status || "").toLowerCase();
      if (normalized === "published" || normalized === "active") return 0;
      if (normalized === "draft") return 1;
      return 2;
    };

    const scoreDiff = statusScore(a.status) - statusScore(b.status);
    if (scoreDiff !== 0) return scoreDiff;

    const aDate = a.start_date ? new Date(a.start_date).getTime() : 0;
    const bDate = b.start_date ? new Date(b.start_date).getTime() : 0;
    const aFuture = aDate >= nowMs;
    const bFuture = bDate >= nowMs;

    if (aFuture && bFuture) return aDate - bDate;
    if (aFuture !== bFuture) return aFuture ? -1 : 1;
    return bDate - aDate;
  });

  const eventIds = events.map((event) => event.id);

  const [analyticsRes, ordersRes, tiersRes, ticketsRes] = await Promise.all([
    supabase.from("event_analytics").select("event_id, total_revenue, platform_revenue, producer_revenue, tickets_sold, tickets_checked_in, page_views, conversion_rate, events(id, title, status, start_date, end_date, venue_city, cover_image_url, max_capacity, views_count, is_featured, platform_fee_percent, slug, created_at)").in("event_id", eventIds),
    supabase
      .from("orders")
      .select("id, event_id, total, platform_fee, payment_gateway_fee, refunded_amount, coupon_id, payment_method, created_at, status, payment_status")
      .in("event_id", eventIds),
    supabase
      .from("ticket_tiers")
      .select("id, event_id, name, quantity_total, quantity_sold")
      .in("event_id", eventIds),
    supabase
      .from("tickets")
      .select("id, event_id, order_id, status, created_at, checked_in_at, tier_id, owner_id, ticket_tiers(name), orders(id, status, payment_status, total, platform_fee, payment_gateway_fee, refunded_amount)")
      .in("event_id", eventIds)
      .in("status", ["active", "used"]),
  ]);

  if (analyticsRes.error) throw analyticsRes.error;
  if (ordersRes.error) throw ordersRes.error;
  if (tiersRes.error) throw tiersRes.error;
  if (ticketsRes.error) throw ticketsRes.error;

  const analytics = analyticsRes.data || [];
  const rawOrders = ordersRes.data || [];
  const tiers = tiersRes.data || [];
  const rawTickets = ticketsRes.data || [];

  const paidOrders = rawOrders.filter(isOrderPaid);
  const paidTicketsWithConfirmedOrder = rawTickets.filter((ticket: any) => {
    const rawOrder = Array.isArray(ticket.orders) ? ticket.orders[0] : ticket.orders;
    return !!ticket.order_id && !!rawOrder?.id && isOrderPaid(rawOrder);
  });
  const paidOrdersFromTickets = paidTicketsWithConfirmedOrder
    .map((ticket: any) => (Array.isArray(ticket.orders) ? ticket.orders[0] : ticket.orders))
    .filter(Boolean);
  const effectivePaidOrders = dedupeOrders([...paidOrders, ...paidOrdersFromTickets]);

  const analyticsByEventId = new Map(analytics.map((row) => [row.event_id, row]));
  const tiersByEventId = new Map<string, any[]>();
  for (const tier of tiers) {
    const list = tiersByEventId.get(tier.event_id) || [];
    list.push(tier);
    tiersByEventId.set(tier.event_id, list);
  }

  const paidOrdersByEventId = new Map<string, any[]>();
  for (const order of effectivePaidOrders) {
    const list = paidOrdersByEventId.get(order.event_id) || [];
    list.push(order);
    paidOrdersByEventId.set(order.event_id, list);
  }

  const totalGrossRevenue = effectivePaidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const totalPlatformRevenue = effectivePaidOrders.reduce((sum, order) => sum + Number(order.platform_fee || 0), 0);
  const totalGatewayFees = effectivePaidOrders.reduce((sum, order) => sum + Number(order.payment_gateway_fee || 0), 0);
  const totalRefundAmount = effectivePaidOrders.reduce((sum, order) => sum + Number(order.refunded_amount || 0), 0);
  const totalTicketRevenue = Math.max(totalGrossRevenue - totalPlatformRevenue, 0);
  const totalNetRevenue = Math.max(totalTicketRevenue - totalGatewayFees - totalRefundAmount, 0);

  const totalEvents = events.length;
  const publishedEvents = events.filter((event) => String(event.status || "").toLowerCase() === "published").length;
  const draftEvents = events.filter((event) => String(event.status || "").toLowerCase() === "draft").length;
  const endedEvents = events.filter((event) => ["ended", "completed", "finished", "done"].includes(String(event.status || "").toLowerCase())).length;
  const activeEvents = events.filter((event) => ["published", "active"].includes(String(event.status || "").toLowerCase())).length;

  const upcomingBase = events
    .filter((event) => !!event.start_date && new Date(event.start_date).getTime() > nowMs)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  const buildEventSummary = (event: any) => {
    const eventAnalytics = analyticsByEventId.get(event.id);
    const eventTiers = tiersByEventId.get(event.id) || [];
    const eventPaidOrders = paidOrdersByEventId.get(event.id) || [];

    const grossRevenue = eventPaidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const platformRevenue = eventPaidOrders.reduce((sum, order) => sum + Number(order.platform_fee || 0), 0);
    const gatewayFees = eventPaidOrders.reduce((sum, order) => sum + Number(order.payment_gateway_fee || 0), 0);
    const refundAmount = eventPaidOrders.reduce((sum, order) => sum + Number(order.refunded_amount || 0), 0);
    const ticketRevenue = Math.max(grossRevenue - platformRevenue, 0);
    const netRevenue = Math.max(ticketRevenue - gatewayFees - refundAmount, 0);
    const totalCapacity = eventTiers.reduce((sum, tier) => sum + Number(tier.quantity_total || 0), 0);
    const capacitySold = eventTiers.reduce((sum, tier) => sum + Number(tier.quantity_sold || 0), 0);
    const ticketsSoldEvent = Number(eventAnalytics?.tickets_sold || capacitySold || 0);
    const ticketsCheckedInEvent = Number(eventAnalytics?.tickets_checked_in || 0);
    const pageViewsEvent = Number(eventAnalytics?.page_views || event.views_count || 0);
    const conversionRateEvent = pageViewsEvent > 0 ? (ticketsSoldEvent / pageViewsEvent) * 100 : 0;
    const checkinRateEvent = ticketsSoldEvent > 0 ? (ticketsCheckedInEvent / ticketsSoldEvent) * 100 : 0;
    const occupancyRate = totalCapacity > 0 ? (capacitySold / totalCapacity) * 100 : 0;
    const remainingCapacity = Math.max(totalCapacity - capacitySold, 0);
    const daysUntilEvent = event.start_date
      ? Math.ceil((new Date(event.start_date).getTime() - nowMs) / 86_400_000)
      : null;
    const paidOrdersLast7DaysCount = eventPaidOrders.filter((order) => order.created_at && new Date(order.created_at).getTime() >= sevenDaysAgoMs).length;
    const revenueLast7DaysAmount = eventPaidOrders
      .filter((order) => order.created_at && new Date(order.created_at).getTime() >= sevenDaysAgoMs)
      .reduce((sum, order) => sum + Math.max(0, Number(order.total || 0) - Number(order.platform_fee || 0)), 0);
    const paidOrdersLast30DaysCount = eventPaidOrders.filter((order) => order.created_at && new Date(order.created_at).getTime() >= thirtyDaysAgoMs).length;
    const revenueLast30DaysAmount = eventPaidOrders
      .filter((order) => order.created_at && new Date(order.created_at).getTime() >= thirtyDaysAgoMs)
      .reduce((sum, order) => sum + Math.max(0, Number(order.total || 0) - Number(order.platform_fee || 0)), 0);
    const couponOrdersCount = eventPaidOrders.filter((order) => !!order.coupon_id).length;
    const couponUseRate = eventPaidOrders.length > 0 ? (couponOrdersCount / eventPaidOrders.length) * 100 : 0;

    return {
      id: event.id,
      title: event.title,
      status: event.status,
      slug: event.slug || null,
      start_date: event.start_date || null,
      end_date: event.end_date || null,
      venue_city: event.venue_city || null,
      grossRevenue,
      totalRevenue: grossRevenue,
      revenue: grossRevenue,
      ticketRevenue,
      netRevenue,
      platformRevenue,
      gatewayFees,
      refundAmount,
      pageViews: pageViewsEvent,
      ticketsSold: ticketsSoldEvent,
      ticketsCheckedIn: ticketsCheckedInEvent,
      conversionRate: conversionRateEvent,
      checkinRate: checkinRateEvent,
      capacityTotal: totalCapacity,
      capacitySold,
      occupancyRate,
      remainingCapacity,
      daysUntilEvent,
      paidOrdersCount: eventPaidOrders.length,
      paidOrdersLast7DaysCount,
      revenueLast7DaysAmount,
      paidOrdersLast30DaysCount,
      revenueLast30DaysAmount,
      couponOrdersCount,
      couponUseRate,
      hasPublishedTiers: eventTiers.length > 0,
    };
  };

  const topEvents = events
    .map((event) => buildEventSummary(event))
    .sort((a, b) => b.netRevenue - a.netRevenue || b.ticketsSold - a.ticketsSold || b.pageViews - a.pageViews);

  const focusEventRaw = sortedForFocus[0];
  const focusEvent = focusEventRaw ? buildEventSummary(focusEventRaw) : null;

  const timelineByDay = buildProducerTimelineSeries({ orders: effectivePaidOrders, tickets: rawTickets }, "day");
  const timelineByMonth = buildProducerTimelineSeries({ orders: effectivePaidOrders, tickets: rawTickets }, "month");

  const ticketsSold = Number(analytics.reduce((sum, row) => sum + Number(row.tickets_sold || 0), 0)) || topEvents.reduce((sum, event) => sum + Number(event.ticketsSold || 0), 0);
  const ticketsCheckedIn = Number(analytics.reduce((sum, row) => sum + Number(row.tickets_checked_in || 0), 0)) || topEvents.reduce((sum, event) => sum + Number(event.ticketsCheckedIn || 0), 0);
  const pageViews = Number(analytics.reduce((sum, row) => sum + Number(row.page_views || 0), 0)) || events.reduce((sum, event) => sum + Number(event.views_count || 0), 0);
  const checkinRate = ticketsSold > 0 ? (ticketsCheckedIn / ticketsSold) * 100 : 0;
  const conversionRate = pageViews > 0 ? (ticketsSold / pageViews) * 100 : 0;

  const totalCapacity = topEvents.reduce((sum, event) => sum + Number(event.capacityTotal || 0), 0);
  const capacitySold = topEvents.reduce((sum, event) => sum + Number(event.capacitySold || 0), 0);
  const portfolioOccupancyRate = totalCapacity > 0 ? (capacitySold / totalCapacity) * 100 : 0;
  const soldOutEvents = topEvents.filter((event) => event.capacityTotal > 0 && event.capacitySold >= event.capacityTotal).length;
  const nearSoldOutEvents = topEvents.filter((event) => {
    if (event.capacityTotal <= 0) return false;
    const remaining = Math.max(event.capacityTotal - event.capacitySold, 0);
    return remaining > 0 && (remaining / event.capacityTotal) <= 0.2;
  }).length;

  const averageOrderValue = effectivePaidOrders.length > 0 ? totalGrossRevenue / effectivePaidOrders.length : 0;
  const averageRevenuePerTicket = ticketsSold > 0 ? totalNetRevenue / ticketsSold : 0;
  const viewsPerTicket = ticketsSold > 0 ? pageViews / ticketsSold : 0;
  const ordersLast7DaysCount = effectivePaidOrders.filter((order) => order.created_at && new Date(order.created_at).getTime() >= sevenDaysAgoMs).length;
  const revenueLast7DaysAmount = effectivePaidOrders
    .filter((order) => order.created_at && new Date(order.created_at).getTime() >= sevenDaysAgoMs)
    .reduce((sum, order) => sum + Math.max(0, Number(order.total || 0) - Number(order.platform_fee || 0)), 0);
  const ordersLast30DaysCount = effectivePaidOrders.filter((order) => order.created_at && new Date(order.created_at).getTime() >= thirtyDaysAgoMs).length;
  const revenueLast30DaysAmount = effectivePaidOrders
    .filter((order) => order.created_at && new Date(order.created_at).getTime() >= thirtyDaysAgoMs)
    .reduce((sum, order) => sum + Math.max(0, Number(order.total || 0) - Number(order.platform_fee || 0)), 0);
  const ticketsSoldLast7DaysCount = rawTickets.filter((ticket) => ticket.created_at && new Date(ticket.created_at).getTime() >= sevenDaysAgoMs).length;
  const ticketsSoldLast30DaysCount = rawTickets.filter((ticket) => ticket.created_at && new Date(ticket.created_at).getTime() >= thirtyDaysAgoMs).length;
  const checkinsLast7DaysCount = rawTickets.filter((ticket) => ticket.checked_in_at && new Date(ticket.checked_in_at).getTime() >= sevenDaysAgoMs).length;
  const checkinsLast30DaysCount = rawTickets.filter((ticket) => ticket.checked_in_at && new Date(ticket.checked_in_at).getTime() >= thirtyDaysAgoMs).length;

  const practicalAlerts: Array<{
    id: string;
    severity: "critical" | "warning" | "info";
    title: string;
    description: string;
    ctaLabel: string;
    ctaTo: string;
  }> = [];

  if (focusEvent) {
    const focusStatus = String(focusEvent.status || "").toLowerCase();

    if (!focusEvent.hasPublishedTiers) {
      practicalAlerts.push({
        id: `no-tiers-${focusEvent.id}`,
        severity: "critical",
        title: "Sem ingressos publicados",
        description: "Sem lotes de ingressos, o evento não consegue vender.",
        ctaLabel: "Publicar ingressos",
        ctaTo: `/producer/events/${focusEvent.id}/edit`,
      });
    }

    if (focusStatus !== "published" && focusStatus !== "active") {
      practicalAlerts.push({
        id: `not-published-${focusEvent.id}`,
        severity: "warning",
        title: "Evento ainda não publicado",
        description: "Seu evento está em rascunho e ainda não está visível para venda.",
        ctaLabel: "Revisar e publicar",
        ctaTo: `/producer/events/${focusEvent.id}/edit`,
      });
    }

    if (focusEvent.daysUntilEvent !== null && focusEvent.daysUntilEvent <= 14 && focusEvent.paidOrdersLast7DaysCount === 0) {
      practicalAlerts.push({
        id: `no-sales-7d-${focusEvent.id}`,
        severity: "warning",
        title: "Sem vendas nos últimos 7 dias",
        description: "Ative divulgação ou ajuste os lotes para retomar as vendas antes do evento.",
        ctaLabel: "Abrir painel do evento",
        ctaTo: `/producer/events/${focusEvent.id}/panel`,
      });
    }

    if (focusEvent.capacityTotal > 0) {
      const remainingRatio = focusEvent.remainingCapacity / focusEvent.capacityTotal;
      if (remainingRatio <= 0.2 && focusEvent.remainingCapacity > 0) {
        practicalAlerts.push({
          id: `near-sold-out-${focusEvent.id}`,
          severity: "info",
          title: "Lote quase esgotado",
          description: `Restam ${focusEvent.remainingCapacity} ingressos disponíveis no evento em foco.`,
          ctaLabel: "Antecipar virada de lote",
          ctaTo: `/producer/events/${focusEvent.id}/edit`,
        });
      }
    }
  }

  if (conversionRate < 1.5 && pageViews >= 100) {
    practicalAlerts.push({
      id: "low-conversion",
      severity: "warning",
      title: "Conversão abaixo do esperado",
      description: `${conversionRate.toFixed(1).replace(".", ",")}% das visualizações viraram ingressos no portfólio.`,
      ctaLabel: "Revisar vitrine e oferta",
      ctaTo: focusEvent ? `/producer/events/${focusEvent.id}/panel` : "/producer/events",
    });
  }

  if (totalRefundAmount > 0 && totalGrossRevenue > 0 && (totalRefundAmount / totalGrossRevenue) > 0.05) {
    practicalAlerts.push({
      id: "refund-pressure",
      severity: "warning",
      title: "Volume relevante de estornos",
      description: `${formatPercent((totalRefundAmount / totalGrossRevenue) * 100)} do GMV já voltou em estornos.`,
      ctaLabel: "Revisar repasses e suporte",
      ctaTo: "/producer/financial",
    });
  }

  if (practicalAlerts.length === 0) {
    practicalAlerts.push({
      id: "all-good",
      severity: "info",
      title: "Tudo certo para continuar vendendo",
      description: "Seu portfólio está sem pendências críticas no momento.",
      ctaLabel: "Abrir painel completo",
      ctaTo: focusEvent ? `/producer/events/${focusEvent.id}/panel` : "/producer/events",
    });
  }

  const otherUpcomingEvents = upcomingBase
    .filter((event) => event.id !== focusEventRaw?.id)
    .slice(0, 3)
    .map((event) => buildEventSummary(event));

  return {
    totalRevenue: totalGrossRevenue,
    grossRevenue: totalGrossRevenue,
    netRevenue: totalNetRevenue,
    ticketRevenue: totalTicketRevenue,
    platformRevenue: totalPlatformRevenue,
    gatewayFees: totalGatewayFees,
    refundAmount: totalRefundAmount,
    ticketsSold,
    ticketsCheckedIn,
    pageViews,
    conversionRate,
    checkinRate,
    portfolioOccupancyRate,
    averageOrderValue,
    averageRevenuePerTicket,
    viewsPerTicket,
    totalEvents,
    upcomingEvents: upcomingBase.length,
    activeEvents,
    publishedEvents,
    draftEvents,
    endedEvents,
    soldOutEvents,
    nearSoldOutEvents,
    confirmedOrders: effectivePaidOrders.length,
    ordersLast7DaysCount,
    revenueLast7DaysAmount,
    ordersLast30DaysCount,
    revenueLast30DaysAmount,
    ticketsSoldLast7DaysCount,
    ticketsSoldLast30DaysCount,
    checkinsLast7DaysCount,
    checkinsLast30DaysCount,
    timelineByDay,
    timelineByMonth,
    focusEvent,
    topEvents,
    otherUpcomingEvents,
    practicalAlerts: practicalAlerts.slice(0, 4),
  };
}

// ============================================================
// PRODUCER — EVENT UTILITIES
// ============================================================

export async function getProducerEventBasic(eventId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("title, slug")
    .eq("id", eventId)
    .single();
  if (error) throw error;
  return data;
}

export async function getProducerEventById(eventId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();
  if (error) throw error;
  return data;
}

export async function getEventTiersAll(eventId: string) {
  const { data, error } = await supabase
    .from("ticket_tiers")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getEventTiersBasic(eventId: string) {
  const { data, error } = await supabase
    .from("ticket_tiers")
    .select("id, name")
    .eq("event_id", eventId);
  if (error) throw error;
  return data || [];
}

export async function uploadEventImage(path: string, file: File) {
  const { data, error } = await supabase.storage
    .from("event-images")
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from("event-images").getPublicUrl(data.path);
  return publicUrl;
}

// ============================================================
// PRODUCER — BULK MESSAGES
// ============================================================

export async function getEventMessages(eventId: string) {
  const { data, error } = await supabase
    .from("bulk_messages")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getEventMessageRecipientCount(eventId: string, tierFilter?: string) {
  let query = supabase
    .from("tickets")
    .select("attendee_email", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "active");
  if (tierFilter && tierFilter !== "all") query = query.eq("tier_id", tierFilter);
  const { count, error } = await query;
  if (error) return 0;
  return count || 0;
}

export async function createBulkMessage(msg: {
  event_id: string;
  producer_id: string;
  subject: string;
  body: string;
  recipient_filter: any;
  recipients_count: number;
  status: string;
}) {
  const { data, error } = await supabase
    .from("bulk_messages")
    .insert(msg)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBulkMessageStatus(messageId: string, status: string) {
  const { error } = await supabase
    .from("bulk_messages")
    .update({ status })
    .eq("id", messageId);
  if (error) throw error;
}

export async function sendBulkMessage(messageId: string) {
  // 1. Fetch the message to get its filter and content
  const { data: msg, error: msgErr } = await supabase
    .from("bulk_messages")
    .select("*")
    .eq("id", messageId)
    .single();
  if (msgErr || !msg) throw msgErr || new Error("Mensagem não encontrada");

  // 2. Fetch recipient user IDs from tickets matching filter
  const filter = msg.recipient_filter as any;
  let query = supabase
    .from("tickets")
    .select("owner_id, attendee_email")
    .eq("event_id", msg.event_id)
    .eq("status", filter?.status || "active");
  if (filter?.tier_ids?.length) {
    query = query.in("tier_id", filter.tier_ids);
  }
  const { data: tickets, error: tErr } = await query;
  if (tErr) throw tErr;

  // Deduplicate by owner_id
  const uniqueOwners = [...new Set((tickets || []).map(t => t.owner_id).filter(Boolean))];

  if (uniqueOwners.length === 0) {
    await supabase
      .from("bulk_messages")
      .update({ status: "sent", sent_at: new Date().toISOString() } as any)
      .eq("id", messageId);
    return;
  }

  // 3. Create in-app notifications for each unique owner
  const notifications = uniqueOwners.map(uid => ({
    user_id: uid,
    type: "bulk_message",
    title: msg.subject,
    body: msg.body,
    data: { message_id: messageId, event_id: msg.event_id },
  }));

  // Insert in batches of 500
  for (let i = 0; i < notifications.length; i += 500) {
    const chunk = notifications.slice(i, i + 500);
    await supabase.from("notifications").insert(chunk);
  }

  // 4. Update message status to "sent"
  await supabase
    .from("bulk_messages")
    .update({ status: "sent", sent_at: new Date().toISOString() } as any)
    .eq("id", messageId);
}
