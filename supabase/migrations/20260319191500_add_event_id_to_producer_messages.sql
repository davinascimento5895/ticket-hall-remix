ALTER TABLE public.producer_messages
ADD COLUMN IF NOT EXISTS event_id uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'producer_messages_event_id_fkey'
  ) THEN
    ALTER TABLE public.producer_messages
    ADD CONSTRAINT producer_messages_event_id_fkey
    FOREIGN KEY (event_id)
    REFERENCES public.events(id)
    ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS producer_messages_event_id_idx
ON public.producer_messages(event_id);
