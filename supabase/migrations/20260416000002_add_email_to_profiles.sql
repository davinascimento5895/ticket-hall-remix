-- Add email column to profiles so it can be queried from the frontend
-- (e.g., staff check-in search, ticket lookups).

-- 1. Add column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill existing profiles from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '');

-- 3. Create function to sync email from auth.users on insert/update
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.email := (SELECT email FROM auth.users WHERE id = NEW.id);
  RETURN NEW;
END;
$$;

-- 4. Attach trigger
DROP TRIGGER IF EXISTS trg_sync_profile_email ON public.profiles;
CREATE TRIGGER trg_sync_profile_email
  BEFORE INSERT OR UPDATE OF id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email();
