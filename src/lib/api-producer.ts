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
    .select("id, status, total, platform_fee, payment_method, created_at, buyer_id, profiles!orders_buyer_id_fkey(full_name, email)", { count: "exact" })
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
    .select("id, status, attendee_name, attendee_email, checked_in_at, created_at, tier_id, owner_id, ticket_tiers(name), profiles!tickets_owner_id_fkey(full_name, email)", { count: "exact" })
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
  const { data: events } = await supabase
    .from("events")
    .select("id, title, status, start_date, max_capacity")
    .eq("producer_id", producerId);

  if (!events || events.length === 0) {
    return { totalRevenue: 0, ticketsSold: 0, totalEvents: 0, upcomingEvents: 0, recentOrders: [] };
  }

  const eventIds = events.map((e) => e.id);

  // Parallelize analytics + orders queries
  const [analyticsRes, ordersRes] = await Promise.all([
    supabase.from("event_analytics").select("*").in("event_id", eventIds),
    supabase.from("orders")
      .select("*, events(title), profiles!orders_buyer_id_fkey(full_name)")
      .in("event_id", eventIds)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const analytics = analyticsRes.data;
  const recentOrders = ordersRes.data;

  const totalRevenue = analytics?.reduce((s, a) => s + (a.producer_revenue || 0), 0) || 0;
  const ticketsSold = analytics?.reduce((s, a) => s + (a.tickets_sold || 0), 0) || 0;
  const now = new Date().toISOString();
  const upcomingEvents = events.filter((e) => e.start_date > now).length;

  return {
    totalRevenue,
    ticketsSold,
    totalEvents: events.length,
    upcomingEvents,
    recentOrders: recentOrders || [],
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
