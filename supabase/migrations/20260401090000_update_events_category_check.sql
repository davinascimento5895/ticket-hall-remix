-- Migration: map old event categories and update events.category check constraint
-- Date: 2026-04-01

BEGIN;

-- 1) Map legacy category values to the frontend categories
UPDATE public.events
SET category = CASE
  WHEN category IN ('music', 'festival') THEN 'shows'
  WHEN category = 'education' THEN 'corporate'
  ELSE category
END
WHERE category IS NOT NULL;

-- 2) Replace the old check constraint with an updated list that matches
-- the frontend `EVENT_CATEGORIES` values.
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_category_check;

ALTER TABLE public.events ADD CONSTRAINT events_category_check CHECK (
  category IS NULL OR category IN (
    'shows', 'theater', 'standup', 'sports', 'tours', 'deals', 'corporate', 'kids', 'shopping', 'other'
  )
);

COMMIT;
