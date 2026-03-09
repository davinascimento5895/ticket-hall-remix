/**
 * Resale Marketplace API
 */
import { supabase } from "@/integrations/supabase/client";

const PLATFORM_FEE_PERCENT = 0.10;

export function calculateResaleFee(askingPrice: number) {
  const platformFee = Math.round(askingPrice * PLATFORM_FEE_PERCENT * 100) / 100;
  const sellerReceives = Math.round((askingPrice - platformFee) * 100) / 100;
  return { platformFee, sellerReceives, buyerPays: askingPrice };
}

/** Get active resale listings, optionally filtered */
export async function getResaleListings(filters?: {
  eventId?: string;
  search?: string;
  city?: string;
  category?: string;
  limit?: number;
}) {
  let query = supabase
    .from("resale_listings" as any)
    .select(`
      *,
      events!inner(id, title, slug, cover_image_url, start_date, end_date, venue_name, venue_city, venue_state, category),
      ticket_tiers!inner(id, name, price)
    `)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (filters?.eventId) query = query.eq("event_id", filters.eventId);
  if (filters?.search) query = (query as any).or(`events.title.ilike.%${filters.search}%`, { foreignTable: "events" });
  if (filters?.city) query = (query as any).eq("events.venue_city", filters.city);
  if (filters?.category) query = (query as any).eq("events.category", filters.category);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data as any[];
}

/** Get a single listing by ID */
export async function getResaleListingById(id: string) {
  const { data, error } = await supabase
    .from("resale_listings" as any)
    .select(`
      *,
      events(id, title, slug, cover_image_url, start_date, end_date, venue_name, venue_city, venue_state, category),
      ticket_tiers(id, name, price),
      profiles:seller_id(full_name, avatar_url)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as any;
}

/** Create a resale listing */
export async function createResaleListing(params: {
  ticketId: string;
  eventId: string;
  tierId: string;
  sellerId: string;
  askingPrice: number;
  originalPrice: number;
  expiresAt: string;
}) {
  const { platformFee, sellerReceives } = calculateResaleFee(params.askingPrice);

  // Mark ticket as for resale
  await supabase
    .from("tickets")
    .update({ is_for_resale: true, resale_price: params.askingPrice } as any)
    .eq("id", params.ticketId);

  const { data, error } = await supabase
    .from("resale_listings" as any)
    .insert({
      ticket_id: params.ticketId,
      seller_id: params.sellerId,
      event_id: params.eventId,
      tier_id: params.tierId,
      original_price: params.originalPrice,
      asking_price: params.askingPrice,
      platform_fee_amount: platformFee,
      seller_receives: sellerReceives,
      expires_at: params.expiresAt,
    })
    .select()
    .single();

  if (error) {
    // Revert ticket
    await supabase
      .from("tickets")
      .update({ is_for_resale: false, resale_price: null } as any)
      .eq("id", params.ticketId);
    throw error;
  }
  return data;
}

/** Cancel a resale listing */
export async function cancelResaleListing(listingId: string, ticketId: string) {
  const { error } = await supabase
    .from("resale_listings" as any)
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", listingId);

  if (error) throw error;

  // Mark ticket as no longer for resale
  await supabase
    .from("tickets")
    .update({ is_for_resale: false, resale_price: null } as any)
    .eq("id", ticketId);
}

/** Purchase a resale listing via edge function */
export async function purchaseResaleListing(listingId: string) {
  const { data, error } = await supabase.functions.invoke("purchase-resale", {
    body: { listingId },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

/** Get listings by seller */
export async function getMyResaleListings(sellerId: string) {
  const { data, error } = await supabase
    .from("resale_listings" as any)
    .select(`
      *,
      events(id, title, slug, start_date, cover_image_url),
      ticket_tiers(id, name, price)
    `)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as any[];
}
