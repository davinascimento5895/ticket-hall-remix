-- Virtual Queue table
CREATE TABLE public.virtual_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- for anonymous users
  position INTEGER,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, admitted, expired, left
  admitted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- admission window expires
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.virtual_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their queue entry" ON public.virtual_queue
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can join queue" ON public.virtual_queue
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage queue" ON public.virtual_queue
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Producers can view queue for their events" ON public.virtual_queue
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = virtual_queue.event_id AND events.producer_id = auth.uid())
  );

CREATE INDEX idx_virtual_queue_event_status ON public.virtual_queue(event_id, status);
CREATE INDEX idx_virtual_queue_user ON public.virtual_queue(user_id);

-- Certificates table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_code TEXT NOT NULL UNIQUE,
  attendee_name TEXT NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now(),
  download_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their certificates" ON public.certificates
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage certificates" ON public.certificates
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Producers can view certificates for their events" ON public.certificates
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = certificates.event_id AND events.producer_id = auth.uid())
  );

CREATE INDEX idx_certificates_user ON public.certificates(user_id);
CREATE INDEX idx_certificates_event ON public.certificates(event_id);

-- Add new columns to events for Block 8 features
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS has_virtual_queue BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS has_certificates BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_multi_day BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS has_insurance_option BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS insurance_price NUMERIC DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS certificate_template TEXT DEFAULT 'default';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS queue_capacity INTEGER DEFAULT 0;

-- Add multi-day valid_dates to ticket_tiers
ALTER TABLE public.ticket_tiers ADD COLUMN IF NOT EXISTS valid_dates TIMESTAMPTZ[] DEFAULT NULL;

-- Add half-price (meia-entrada) fields to tickets
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS is_half_price BOOLEAN DEFAULT false;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS half_price_doc_type TEXT; -- 'student_id', 'senior_id', 'disability_id'
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS half_price_doc_number TEXT;

-- Add insurance to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS has_insurance BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS insurance_amount NUMERIC DEFAULT 0;