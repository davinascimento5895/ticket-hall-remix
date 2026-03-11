
-- Producer follows table
CREATE TABLE public.producer_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  producer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, producer_id)
);

ALTER TABLE public.producer_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their follows"
  ON public.producer_follows FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can follow producers"
  ON public.producer_follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow"
  ON public.producer_follows FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Producers can see their follower count"
  ON public.producer_follows FOR SELECT
  TO authenticated
  USING (auth.uid() = producer_id);

-- Producer contact messages table
CREATE TABLE public.producer_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.producer_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Senders can insert messages"
  ON public.producer_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Senders can view their messages"
  ON public.producer_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "Producers can view their inbox"
  ON public.producer_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = producer_id);

CREATE POLICY "Producers can update their messages"
  ON public.producer_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = producer_id);

CREATE POLICY "Admins can manage all messages"
  ON public.producer_messages FOR ALL
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));
