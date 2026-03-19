ALTER TABLE public.producer_messages
ADD COLUMN IF NOT EXISTS replied_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS is_urgent boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS producer_messages_replied_at_idx
ON public.producer_messages(replied_at);

CREATE INDEX IF NOT EXISTS producer_messages_is_urgent_idx
ON public.producer_messages(is_urgent);
