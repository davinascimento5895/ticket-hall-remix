import { supabase } from '@/integrations/supabase/client';

/**
 * Generates a unique slug from a title, checking for collisions in the events table.
 */
export const generateUniqueSlug = async (title: string): Promise<string> => {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  let slug = base;
  let attempt = 0;

  while (true) {
    const { count } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('slug', slug);

    if (count === 0) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }
};
