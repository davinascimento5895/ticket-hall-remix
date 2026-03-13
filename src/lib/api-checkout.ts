/**
 * TicketHall — API for Checkout Questions, Taxes/Fees, Capacity Groups, Products
 */
import { supabase } from "@/integrations/supabase/client";

// ============================================================
// CHECKOUT QUESTIONS
// ============================================================

export async function getCheckoutQuestions(eventId: string) {
  const { data, error } = await supabase
    .from("checkout_questions")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createCheckoutQuestion(question: {
  event_id: string;
  question: string;
  field_type: string;
  options?: any;
  is_required?: boolean;
  applies_to?: string;
  tier_ids?: string[];
  sort_order?: number;
}) {
  const { data, error } = await supabase
    .from("checkout_questions")
    .insert(question)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCheckoutQuestion(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("checkout_questions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCheckoutQuestion(id: string) {
  const { error } = await supabase.from("checkout_questions").delete().eq("id", id);
  if (error) throw error;
}

export async function saveCheckoutAnswers(answers: {
  order_id?: string;
  ticket_id?: string;
  question_id: string;
  answer: string;
}[]) {
  const { data, error } = await supabase
    .from("checkout_answers")
    .insert(answers)
    .select();
  if (error) throw error;
  return data;
}

// ============================================================
// TICKET TAXES & FEES
// ============================================================

export async function getTicketTaxesFees(eventId: string) {
  const { data, error } = await supabase
    .from("ticket_taxes_fees")
    .select("*")
    .eq("event_id", eventId);
  if (error) throw error;
  return data;
}

export async function createTicketTaxFee(fee: {
  event_id: string;
  tier_id?: string;
  name: string;
  fee_type: string;
  amount: number;
  is_passed_to_buyer?: boolean;
}) {
  const { data, error } = await supabase
    .from("ticket_taxes_fees")
    .insert(fee)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTicketTaxFee(id: string) {
  const { error } = await supabase.from("ticket_taxes_fees").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// CAPACITY GROUPS
// ============================================================

export async function getCapacityGroups(eventId: string) {
  const { data, error } = await supabase
    .from("capacity_groups")
    .select("*")
    .eq("event_id", eventId);
  if (error) throw error;
  return data;
}

export async function createCapacityGroup(group: {
  event_id: string;
  name: string;
  capacity: number;
}) {
  const { data, error } = await supabase
    .from("capacity_groups")
    .insert(group)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCapacityGroup(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("capacity_groups")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCapacityGroup(id: string) {
  const { error } = await supabase.from("capacity_groups").delete().eq("id", id);
  if (error) throw error;
}

// EVENT PRODUCTS — moved to src/lib/api-products.ts
// Re-export for backwards compatibility
export { getEventProducts, getEventProductsAll, createEventProduct, updateEventProduct, deleteEventProduct } from "@/lib/api-products";

import { supabase as sb } from "@/integrations/supabase/client";

export async function saveOrderProducts(products: {
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
}[]) {
  const { data, error } = await sb
    .from("order_products")
    .insert(products)
    .select();
  if (error) throw error;
  return data;
}
