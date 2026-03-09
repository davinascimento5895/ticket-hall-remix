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
    .eq("status", "active" as any)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (filters?.eventId) query = query.eq("event_id", filters.eventId);
  if (filters?.city) query = query.eq("events.venue_city" as any, filters.city);
  if (filters?.category) query = query.eq("events.category" as any, filters.category);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw error;

  // Client-side search filter (PostgREST doesn't support .or on foreign tables)
  let results = data ?? [];
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    results = results.filter((l: any) =>
      l.events?.title?.toLowerCase().includes(search) ||
      l.events?.venue_name?.toLowerCase().includes(search)
    );
  }

  return results;
}

/** Get a single listing by ID */
export async function getResaleListingById(id: string) {
  const { data, error } = await supabase
    .from("resale_listings")
    .select(`
      *,
      events(id, title, slug, cover_image_url, start_date, end_date, venue_name, venue_city, venue_state, category),
      ticket_tiers(id, name, price),
      profiles:seller_id(full_name, avatar_url)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

/** Create a resale listing (atomic via RPC) */
export async function createResaleListing(params: {
  ticketId: string;
  eventId: string;
  tierId: string;
  sellerId: string;
  askingPrice: number;
  originalPrice: number;
  expiresAt: string;
}) {
  const { data, error } = await supabase.rpc("create_resale_listing_atomic" as any, {
    p_ticket_id: params.ticketId,
    p_seller_id: params.sellerId,
    p_event_id: params.eventId,
    p_tier_id: params.tierId,
    p_asking_price: params.askingPrice,
    p_original_price: params.originalPrice,
    p_expires_at: params.expiresAt,
  });

  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data;
}

/** Cancel a resale listing */
export async function cancelResaleListing(listingId: string, ticketId: string) {
  const { error, data } = await supabase
    .from("resale_listings")
    .update({ status: "cancelled", updated_at: new Date().toISOString() } as any)
    .eq("id", listingId)
    .eq("status", "active")
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Anúncio não encontrado ou já foi processado");

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
    .from("resale_listings")
    .select(`
      *,
      events(id, title, slug, start_date, cover_image_url),
      ticket_tiers(id, name, price)
    `)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
