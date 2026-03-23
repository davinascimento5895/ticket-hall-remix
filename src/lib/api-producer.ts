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
    .single();
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
    ...(memberships || []).map((m) => m.producer_id).filter(Boolean),
  ]));

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, title, status, start_date, end_date, max_capacity")
    .in("producer_id", producerScopeIds);

  if (eventsError) throw eventsError;

  if (!events || events.length === 0) {
    return {
      totalRevenue: 0,
      ticketsSold: 0,
      totalEvents: 0,
      upcomingEvents: 0,
      activeEvents: 0,
      confirmedOrders: 0,
      focusEvent: null,
      otherUpcomingEvents: [],
      practicalAlerts: [
        {
          id: "first-event",
          severity: "critical",
          title: "Nenhum evento cadastrado",
          description: "Crie seu primeiro evento para começar a vender ingressos.",
          ctaLabel: "Criar evento",
          ctaTo: "/producer/events/new",
        },
      ],
    };
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const nowMs = now.getTime();

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

  const focusEventRaw = sortedForFocus[0];
  const eventIds = events.map((e) => e.id);

  // Parallelize dashboard queries to keep page responsive.
  const [analyticsRes, ordersRes, tiersRes, ticketsRes] = await Promise.all([
    supabase.from("event_analytics").select("*").in("event_id", eventIds),
    supabase
      .from("orders")
      .select("id, event_id, total, created_at, status, payment_status")
      .in("event_id", eventIds),
    supabase
      .from("ticket_tiers")
      .select("id, event_id, name, quantity_total, quantity_sold")
      .in("event_id", eventIds),
    supabase
      .from("tickets")
      .select("id, event_id, order_id, status, orders(status, payment_status, total)")
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

  const paidOrders = rawOrders.filter((order) => {
    const status = String(order.status || "").trim().toLowerCase();
    const paymentStatus = String(order.payment_status || "").trim().toLowerCase();

    // Some legacy and gateway flows may finalize payment with equivalent values.
    const isStatusPaid = status === "paid" || status === "confirmed";
    const isPaymentPaid = ["paid", "confirmed", "received", "approved"].includes(paymentStatus);

    return isStatusPaid || isPaymentPaid;
  });

  const paidTicketsWithConfirmedOrder = rawTickets.filter((ticket: any) => {
    const rawOrder = Array.isArray(ticket.orders) ? ticket.orders[0] : ticket.orders;
    const orderStatus = String(rawOrder?.status || "").trim().toLowerCase();
    const paymentStatus = String(rawOrder?.payment_status || "").trim().toLowerCase();

    const isStatusPaid = orderStatus === "paid" || orderStatus === "confirmed";
    const isPaymentPaid = ["paid", "confirmed", "received", "approved"].includes(paymentStatus);

    return !!ticket.order_id && (isStatusPaid || isPaymentPaid);
  });

  const paidOrderIdsFromTickets = new Set<string>(
    paidTicketsWithConfirmedOrder.map((ticket: any) => String(ticket.order_id)).filter(Boolean),
  );

  const paidOrdersCount = paidOrders.length > 0
    ? paidOrders.length
    : paidOrderIdsFromTickets.size;

  const fallbackRevenueFromTickets = Array.from(
    new Map(
      paidTicketsWithConfirmedOrder.map((ticket: any) => {
        const rawOrder = Array.isArray(ticket.orders) ? ticket.orders[0] : ticket.orders;
        return [String(ticket.order_id), Number(rawOrder?.total || 0)];
      }),
    ).values(),
  ).reduce((sum, total) => sum + total, 0);

  const analyticsByEventId = new Map(analytics.map((a) => [a.event_id, a]));
  const tiersByEventId = new Map<string, any[]>();
  for (const tier of tiers) {
    const list = tiersByEventId.get(tier.event_id) || [];
    list.push(tier);
    tiersByEventId.set(tier.event_id, list);
  }

  const totalRevenue = paidOrders.length > 0
    ? paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)
    : fallbackRevenueFromTickets;
  const ticketsSold = tiers.reduce((sum, tier) => sum + Number(tier.quantity_sold || 0), 0);
  const upcomingBase = events
    .filter((e) => !!e.start_date && e.start_date > nowIso)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  const activeEvents = events.filter((e) => {
    const status = String(e.status || "").toLowerCase();
    return ["published", "active"].includes(status);
  }).length;

  const focusAnalytics = focusEventRaw ? analyticsByEventId.get(focusEventRaw.id) : null;
  const focusTiers = focusEventRaw ? tiersByEventId.get(focusEventRaw.id) || [] : [];
  const totalCapacity = focusTiers.reduce((sum, tier) => sum + Number(tier.quantity_total || 0), 0);
  const soldCapacity = focusTiers.reduce((sum, tier) => sum + Number(tier.quantity_sold || 0), 0);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const focusPaidOrders = focusEventRaw
    ? paidOrders.filter((order) => order.event_id === focusEventRaw.id)
    : [];

  const focusPaidOrdersLast7Days = focusPaidOrders.filter((order) => {
    if (!order.created_at) return false;
    return new Date(order.created_at).getTime() >= sevenDaysAgo.getTime();
  });

  const paidOrdersLast7DaysCount = focusPaidOrdersLast7Days.length;
  const paidSalesLast7DaysAmount = focusPaidOrdersLast7Days.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0,
  );

  const focusDaysUntilEvent = focusEventRaw?.start_date
    ? Math.ceil((new Date(focusEventRaw.start_date).getTime() - nowMs) / 86_400_000)
    : null;

  const focusEvent = focusEventRaw
    ? {
      id: focusEventRaw.id,
      title: focusEventRaw.title,
      status: focusEventRaw.status,
      start_date: focusEventRaw.start_date,
      daysUntilEvent: focusDaysUntilEvent,
      revenue: focusPaidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      ticketsSold: Number(focusAnalytics?.tickets_sold || soldCapacity || 0),
      capacityTotal: totalCapacity,
      capacitySold: soldCapacity,
      paidOrdersLast7DaysCount,
      paidSalesLast7DaysAmount,
      hasPublishedTiers: focusTiers.length > 0,
    }
    : null;

  const otherUpcomingEvents = upcomingBase
    .filter((event) => event.id !== focusEventRaw?.id)
    .slice(0, 3)
    .map((event) => {
    const eventAnalytics = analyticsByEventId.get(event.id);
    return {
      id: event.id,
      title: event.title,
      status: event.status,
      start_date: event.start_date,
      ticketsSold: eventAnalytics?.tickets_sold || 0,
      revenue: eventAnalytics?.producer_revenue || 0,
    };
  });

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

    if (
      focusEvent.daysUntilEvent !== null
      && focusEvent.daysUntilEvent <= 14
      && focusEvent.paidOrdersLast7DaysCount === 0
    ) {
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
      const remaining = Math.max(focusEvent.capacityTotal - focusEvent.capacitySold, 0);
      const remainingRatio = remaining / focusEvent.capacityTotal;
      if (remainingRatio <= 0.2 && remaining > 0) {
        practicalAlerts.push({
          id: `near-sold-out-${focusEvent.id}`,
          severity: "info",
          title: "Lote quase esgotado",
          description: `Restam ${remaining} ingressos disponíveis no evento em foco.`,
          ctaLabel: "Antecipar virada de lote",
          ctaTo: `/producer/events/${focusEvent.id}/edit`,
        });
      }
    }
  }

  if (practicalAlerts.length === 0) {
    practicalAlerts.push({
      id: "all-good",
      severity: "info",
      title: "Tudo certo para continuar vendendo",
      description: "Seu evento principal está sem pendências críticas no momento.",
      ctaLabel: "Abrir painel completo",
      ctaTo: focusEvent ? `/producer/events/${focusEvent.id}/panel` : "/producer/events",
    });
  }

  return {
    totalRevenue,
    ticketsSold,
    totalEvents: events.length,
    upcomingEvents: upcomingBase.length,
    activeEvents,
    confirmedOrders: paidOrdersCount,
    focusEvent,
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
