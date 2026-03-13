-- Add cnpj column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cnpj TEXT;

-- Add visibility and online_platform columns to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private'));
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS online_platform TEXT DEFAULT 'external';
