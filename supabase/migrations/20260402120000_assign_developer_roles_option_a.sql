-- Migration: Assign developer roles (Option A)
-- Maps four developer emails to existing roles (buyer/producer/admin).
-- Run this in the Supabase SQL editor or with psql as a DB admin.

BEGIN;

-- buyer
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'buyer'::public.app_role
FROM auth.users u
WHERE lower(u.email) = lower('developer+@iomob.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- producer
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'producer'::public.app_role
FROM auth.users u
WHERE lower(u.email) = lower('developer++@iomob.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- moderador mapped to staff
DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT u.id FROM auth.users u WHERE lower(u.email) = lower('developer+++@iomob.com')
) AND role = 'producer';

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'staff'::public.app_role
FROM auth.users u
WHERE lower(u.email) = lower('developer+++@iomob.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- admin
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = lower('developer++++@iomob.com')
ON CONFLICT (user_id, role) DO NOTHING;

COMMIT;
