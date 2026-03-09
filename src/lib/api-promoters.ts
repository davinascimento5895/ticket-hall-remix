import { supabase } from "@/integrations/supabase/client";

// ============================================================
// PROMOTERS
// ============================================================

export async function getPromoters(producerId: string) {
  const { data, error } = await supabase
    .from("promoters")
    .select("*")
    .eq("producer_id", producerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createPromoter(promoter: {
  producer_id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  pix_key?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from("promoters")
    .insert(promoter)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePromoter(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("promoters")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePromoter(id: string) {
  const { error } = await supabase.from("promoters").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// PROMOTER EVENTS (assignments)
// ============================================================

export async function getPromoterEvents(producerId: string, promoterId?: string) {
  let query = supabase
    .from("promoter_events")
    .select("*, promoters(name, email), events(title, start_date, status)")
    .eq("producer_id", producerId)
    .order("created_at", { ascending: false });

  if (promoterId) query = query.eq("promoter_id", promoterId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createPromoterEvent(assignment: {
  promoter_id: string;
  event_id: string;
  producer_id: string;
  commission_type: string;
  commission_value: number;
  tracking_code: string;
}) {
  const { data, error } = await supabase
    .from("promoter_events")
    .insert(assignment)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePromoterEvent(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("promoter_events")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePromoterEvent(id: string) {
  const { error } = await supabase.from("promoter_events").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// PROMOTER COMMISSIONS
// ============================================================

export async function getPromoterCommissions(producerId: string, filters?: {
  promoter_id?: string;
  event_id?: string;
  status?: string;
}) {
  let query = supabase
    .from("promoter_commissions")
    .select("*, promoters(name, email, pix_key), events(title), orders(total, status)")
    .eq("producer_id", producerId)
    .order("created_at", { ascending: false });

  if (filters?.promoter_id) query = query.eq("promoter_id", filters.promoter_id);
  if (filters?.event_id) query = query.eq("event_id", filters.event_id);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function updateCommissionStatus(id: string, status: string) {
  const updates: Record<string, any> = { status };
  if (status === "paid") updates.paid_at = new Date().toISOString();
  const { error } = await supabase
    .from("promoter_commissions")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

export async function batchUpdateCommissionStatus(ids: string[], status: string) {
  const updates: Record<string, any> = { status };
  if (status === "paid") updates.paid_at = new Date().toISOString();
  const { error } = await supabase
    .from("promoter_commissions")
    .update(updates)
    .in("id", ids);
  if (error) throw error;
}

// ============================================================
// PROMOTER RANKING
// ============================================================

export async function getPromoterRanking(producerId: string, eventId?: string) {
  let query = supabase
    .from("promoter_events")
    .select("promoter_id, revenue_generated, conversions, clicks, commission_total, promoters(name, email, status)")
    .eq("producer_id", producerId);

  if (eventId) query = query.eq("event_id", eventId);

  const { data, error } = await query;
  if (error) throw error;

  // Aggregate by promoter
  const map = new Map<string, {
    promoter_id: string;
    name: string;
    email: string;
    status: string;
    totalRevenue: number;
    totalConversions: number;
    totalClicks: number;
    totalCommission: number;
    eventsCount: number;
  }>();

  (data || []).forEach((row: any) => {
    const existing = map.get(row.promoter_id);
    if (existing) {
      existing.totalRevenue += Number(row.revenue_generated || 0);
      existing.totalConversions += Number(row.conversions || 0);
      existing.totalClicks += Number(row.clicks || 0);
      existing.totalCommission += Number(row.commission_total || 0);
      existing.eventsCount += 1;
    } else {
      map.set(row.promoter_id, {
        promoter_id: row.promoter_id,
        name: row.promoters?.name || "",
        email: row.promoters?.email || "",
        status: row.promoters?.status || "active",
        totalRevenue: Number(row.revenue_generated || 0),
        totalConversions: Number(row.conversions || 0),
        totalClicks: Number(row.clicks || 0),
        totalCommission: Number(row.commission_total || 0),
        eventsCount: 1,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
}
