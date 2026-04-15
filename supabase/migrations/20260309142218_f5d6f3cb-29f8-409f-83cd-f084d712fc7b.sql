-- 1. Add unique constraint on event_reviews for upsert support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'event_reviews_user_id_event_id_key'
  ) THEN
    ALTER TABLE public.event_reviews ADD CONSTRAINT event_reviews_user_id_event_id_key UNIQUE (user_id, event_id);
  END IF;
END $$;

-- 2. Ensure attendee fields exist on tickets
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS attendee_name text;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS attendee_email text;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS attendee_cpf text;

-- 3. Enable realtime for orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;
