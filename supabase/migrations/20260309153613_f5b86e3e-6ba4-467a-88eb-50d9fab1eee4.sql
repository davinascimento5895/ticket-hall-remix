
-- Create resale_listings table
CREATE TABLE public.resale_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id),
  seller_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id),
  tier_id UUID NOT NULL REFERENCES public.ticket_tiers(id),
  original_price NUMERIC NOT NULL DEFAULT 0,
  asking_price NUMERIC NOT NULL,
  platform_fee_amount NUMERIC NOT NULL DEFAULT 0,
  seller_receives NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  buyer_id UUID,
  sold_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.resale_listings ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_resale_listings_event_status ON public.resale_listings(event_id, status);
CREATE INDEX idx_resale_listings_seller ON public.resale_listings(seller_id);
CREATE INDEX idx_resale_listings_ticket ON public.resale_listings(ticket_id);

-- RLS Policies
-- Anyone can view active listings
CREATE POLICY "Anyone can view active resale listings"
  ON public.resale_listings FOR SELECT
  USING (status = 'active');

-- Authenticated users can view their own listings (any status)
CREATE POLICY "Sellers can view their own listings"
  ON public.resale_listings FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- Buyers can view listings they purchased
CREATE POLICY "Buyers can view purchased listings"
  ON public.resale_listings FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id);

-- Sellers can create listings
CREATE POLICY "Sellers can create resale listings"
  ON public.resale_listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own active listings (cancel)
CREATE POLICY "Sellers can update their own listings"
  ON public.resale_listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id AND status = 'active')
  WITH CHECK (auth.uid() = seller_id);

-- Admins can manage all
CREATE POLICY "Admins can manage all resale listings"
  ON public.resale_listings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for resale_listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'resale_listings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.resale_listings;
  END IF;
END $$;
