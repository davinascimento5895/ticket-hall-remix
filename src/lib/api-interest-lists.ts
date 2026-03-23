import { supabase } from "@/integrations/supabase/client";

// ── Types ──────────────────────────────────────────────
export interface InterestListField {
  id?: string;
  list_id?: string;
  field_name: string;
  field_type: string;
  placeholder: string;
  is_required: boolean;
  sort_order: number;
  options?: any;
}

export interface InterestList {
  id: string;
  producer_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  venue_name: string | null;
  start_date: string | null;
  status: string;
  max_submissions: number | null;
  expires_at: string | null;
  submissions_count: number;
  created_at: string;
  updated_at: string;
}

// ── Slug generator ─────────────────────────────────────
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/1/I confusion

export const generateUniqueSlug = async (): Promise<string> => {
  let slug = "";
  let exists = true;
  while (exists) {
    slug = Array.from({ length: 8 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
    const { data } = await supabase
      .from("interest_lists")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) exists = false;
  }
  return slug;
};

// ── CRUD ───────────────────────────────────────────────
export const getProducerLists = async (producerId: string) => {
  const { data, error } = await supabase
    .from("interest_lists")
    .select("*")
    .eq("producer_id", producerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as InterestList[];
};

export const getListById = async (id: string) => {
  const { data, error } = await supabase
    .from("interest_lists")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as InterestList;
};

export const getListBySlug = async (slug: string) => {
  const { data, error } = await supabase
    .from("interest_lists")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (error) throw error;
  return data as InterestList;
};

export const createList = async (
  payload: {
    producer_id: string;
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
    venue_name?: string;
    start_date?: string;
    max_submissions?: number | null;
    expires_at?: string | null;
    status?: string;
  },
  fields: InterestListField[]
) => {
  const { data: list, error } = await supabase
    .from("interest_lists")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;

  if (fields.length > 0) {
    const rows = fields.map((f, i) => ({
      list_id: list.id,
      field_name: f.field_name,
      field_type: f.field_type,
      placeholder: f.placeholder,
      is_required: f.is_required,
      sort_order: i,
      options: f.options ?? null,
    }));
    const { error: fErr } = await supabase.from("interest_list_fields").insert(rows);
    if (fErr) throw fErr;
  }
  return list as InterestList;
};

export const updateList = async (
  id: string,
  payload: Partial<InterestList>,
  fields?: InterestListField[]
) => {
  const { error } = await supabase
    .from("interest_lists")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;

  if (fields) {
    // Delete old fields, insert new
    await supabase.from("interest_list_fields").delete().eq("list_id", id);
    if (fields.length > 0) {
      const rows = fields.map((f, i) => ({
        list_id: id,
        field_name: f.field_name,
        field_type: f.field_type,
        placeholder: f.placeholder,
        is_required: f.is_required,
        sort_order: i,
        options: f.options ?? null,
      }));
      const { error: fErr } = await supabase.from("interest_list_fields").insert(rows);
      if (fErr) throw fErr;
    }
  }
};

export const deleteList = async (id: string) => {
  const { error } = await supabase.from("interest_lists").delete().eq("id", id);
  if (error) throw error;
};

export const updateListStatus = async (id: string, status: string) => {
  const { error } = await supabase
    .from("interest_lists")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
};

// ── Fields ─────────────────────────────────────────────
export const getListFields = async (listId: string) => {
  const { data, error } = await supabase
    .from("interest_list_fields")
    .select("*")
    .eq("list_id", listId)
    .order("sort_order");
  if (error) throw error;
  return data as InterestListField[];
};

// ── Submissions ────────────────────────────────────────
export const submitToList = async (listId: string, answers: Record<string, string>) => {
  // Check duplicate by email
  const emailKey = Object.keys(answers).find((k) => k.toLowerCase().includes("e-mail") || k.toLowerCase().includes("email"));
  if (emailKey && answers[emailKey]) {
    const { data: existing } = await supabase
      .from("interest_list_submissions")
      .select("id")
      .eq("list_id", listId)
      .contains("answers", { [emailKey]: answers[emailKey] })
      .maybeSingle();
    if (existing) throw new Error("DUPLICATE_EMAIL");
  }

  const { error } = await supabase
    .from("interest_list_submissions")
    .insert({ list_id: listId, answers });
  if (error) throw error;
};

export const getListSubmissions = async (listId: string) => {
  const { data, error } = await supabase
    .from("interest_list_submissions")
    .select("*")
    .eq("list_id", listId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const exportSubmissionsCSV = async (listId: string, fields: InterestListField[]) => {
  const submissions = await getListSubmissions(listId);
  if (!submissions.length) return "";

  const headers = fields.map((f) => f.field_name);
  const csvHeaders = ["Data", ...headers].join(",");
  const rows = submissions.map((s: any) => {
    const answers = s.answers as Record<string, string>;
    const date = new Date(s.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const values = headers.map((h) => `"${(answers[h] || "").replace(/"/g, '""')}"`);
    return [date, ...values].join(",");
  });
  return [csvHeaders, ...rows].join("\n");
};

// ── Image upload ───────────────────────────────────────
export const uploadListImage = async (file: File, producerId: string) => {
  const ext = file.name.split(".").pop();
  const path = `interest-lists/${producerId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("event-images").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("event-images").getPublicUrl(path);
  return data.publicUrl;
};
