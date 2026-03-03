/**
 * TicketHall API Service Layer
 * All Supabase calls go through here for portability to native apps.
 */
import { supabase } from "@/integrations/supabase/client";

// ============================================================
// EVENTS
// ============================================================

/** Fetch published featured events */
export async function getFeaturedEvents() {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .eq("is_featured", true)
    .order("start_date", { ascending: true })
    .limit(6);
  if (error) throw error;
  return data;
}

/** Fetch published events with optional filters */
export async function getEvents(filters?: {
  category?: string;
  city?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("start_date", { ascending: true });

  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.city) query = query.eq("venue_city", filters.city);
  if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,venue_name.ilike.%${filters.search}%`);
  if (filters?.limit) query = query.limit(filters.limit);
  if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/** Get event by slug */
export async function getEventBySlug(slug: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data;
}

/** Get ticket tiers for an event */
export async function getEventTiers(eventId: string) {
  const { data, error } = await supabase
    .from("ticket_tiers")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data;
}

// ============================================================
// ORDERS
// ============================================================

/** Create an order */
export async function createOrder(order: {
  buyer_id: string;
  event_id: string;
  subtotal: number;
  platform_fee: number;
  total: number;
  expires_at?: string;
}) {
  // PAYMENT_INTEGRATION_POINT — integrate with Pagar.me / Mercado Pago / Stripe
  const { data, error } = await supabase
    .from("orders")
    .insert(order)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Get user's orders */
export async function getMyOrders(userId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, events(title, slug, cover_image_url, start_date, venue_city)")
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// ============================================================
// TICKETS
// ============================================================

/** Get user's tickets */
export async function getMyTickets(userId: string) {
  const { data, error } = await supabase
    .from("tickets")
    .select("*, ticket_tiers(name, price), events(title, slug, cover_image_url, start_date, venue_city, venue_name)")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// ============================================================
// COUPONS
// ============================================================

/** Validate a coupon code for an event */
export async function validateCoupon(eventId: string, code: string) {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("event_id", eventId)
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// PROFILES
// ============================================================

/** Update user profile */
export async function updateProfile(userId: string, updates: {
  full_name?: string;
  phone?: string;
  cpf?: string;
  avatar_url?: string;
}) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// NOTIFICATIONS
// ============================================================

/** Get user's notifications */
export async function getNotifications(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

/** Mark notifications as read */
export async function markNotificationsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
}

// ============================================================
// WAITLIST
// ============================================================

/** Join waitlist */
export async function joinWaitlist(entry: {
  event_id: string;
  tier_id?: string;
  user_id: string;
  email: string;
  phone?: string;
}) {
  const { data, error } = await supabase
    .from("waitlist")
    .insert(entry)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// ANALYTICS (placeholder)
// ============================================================

/**
 * ANALYTICS_INTEGRATION_POINT — connect to Mixpanel, Amplitude, or Plausible
 */
export function trackEvent(_eventName: string, _properties?: Record<string, any>) {
  // Placeholder
}

export function trackPageView(_path: string) {
  // Placeholder
}

export function trackPurchase(_orderId: string, _value: number, _items: any[]) {
  // Placeholder
}
