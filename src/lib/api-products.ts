/**
 * API for Event Products (Catalog-only), Product Images, and Product Variations
 */
import { supabase } from "@/integrations/supabase/client";

// ============================================================
// EVENT PRODUCTS
// ============================================================

export async function getEventProducts(eventId: string) {
  const { data, error } = await supabase
    .from("event_products")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getEventProductsAll(eventId: string) {
  const { data, error } = await supabase
    .from("event_products")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createEventProduct(product: {
  event_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  quantity_available?: number;
  max_per_order?: number;
  sort_order?: number;
}) {
  const { data, error } = await supabase
    .from("event_products")
    .insert(product)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEventProduct(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("event_products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEventProduct(id: string) {
  const { error } = await supabase.from("event_products").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// PRODUCT IMAGES
// ============================================================

export async function getProductImages(productId: string) {
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addProductImage(productId: string, imageUrl: string, sortOrder: number) {
  const { data, error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, image_url: imageUrl, sort_order: sortOrder })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProductImage(imageId: string) {
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) throw error;
}

export async function uploadProductImage(file: File, userId: string) {
  const ext = file.name.split(".").pop();
  const path = `${userId}/products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("event-images").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("event-images").getPublicUrl(path);
  return data.publicUrl;
}

// ============================================================
// PRODUCT VARIATIONS
// ============================================================

export async function getProductVariations(productId: string) {
  const { data, error } = await supabase
    .from("product_variations")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addProductVariation(variation: {
  product_id: string;
  name: string;
  value: string;
  sort_order?: number;
}) {
  const { data, error } = await supabase
    .from("product_variations")
    .insert(variation)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProductVariation(id: string, updates: { name?: string; value?: string }) {
  const { data, error } = await supabase
    .from("product_variations")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProductVariation(id: string) {
  const { error } = await supabase.from("product_variations").delete().eq("id", id);
  if (error) throw error;
}
