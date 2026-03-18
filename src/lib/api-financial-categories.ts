import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

export async function getFinancialCategories(producerId: string, type: string) {
  const { data, error } = await sb
    .from("financial_categories")
    .select("id, value, label, type")
    .eq("producer_id", producerId)
    .eq("type", type)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createFinancialCategory(producerId: string, type: string, payload: { value: string; label: string; }) {
  const { data, error } = await sb
    .from("financial_categories")
    .insert({ producer_id: producerId, type, value: payload.value, label: payload.label })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFinancialCategory(id: string) {
  const { error } = await sb.from("financial_categories").delete().eq("id", id);
  if (error) throw error;
}
