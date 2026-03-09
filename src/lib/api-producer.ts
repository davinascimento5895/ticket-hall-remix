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
  const { data, error } = await supabase
    .from("events")
    .insert(event)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEvent(eventId: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", eventId)
    .select()
    .single();
  if (error) throw error;
  return data;
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
    .select("*, ticket_tiers(name), profiles!tickets_owner_id_fkey(full_name)")
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

  const { data: analytics } = await supabase
    .from("event_analytics")
    .select("*")
    .in("event_id", eventIds);

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("*, events(title), profiles!orders_buyer_id_fkey(full_name)")
    .in("event_id", eventIds)
    .order("created_at", { ascending: false })
    .limit(10);

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
// PRODUCER — AFFILIATES
// ============================================================

export async function getEventAffiliates(eventId: string) {
  const { data, error } = await supabase
    .from("affiliates")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createAffiliate(affiliate: {
  event_id: string;
  producer_id: string;
  name: string;
  code: string;
  commission_type: string;
  commission_value: number;
}) {
  const { data, error } = await supabase
    .from("affiliates")
    .insert(affiliate)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAffiliate(affiliateId: string) {
  const { error } = await supabase.from("affiliates").delete().eq("id", affiliateId);
  if (error) throw error;
}

export async function toggleAffiliate(affiliateId: string, isActive: boolean) {
  const { error } = await supabase
    .from("affiliates")
    .update({ is_active: isActive })
    .eq("id", affiliateId);
  if (error) throw error;
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
  const { error } = await supabase.functions.invoke("send-bulk-message", {
    body: { messageId },
  });
  if (error) throw error;
}
