
-- ============================================
-- BLOCO 1.3: Performance indexes
-- ============================================

-- Events
CREATE INDEX IF NOT EXISTS idx_events_status_start_date ON public.events(status, start_date);
CREATE INDEX IF NOT EXISTS idx_events_venue_city ON public.events(venue_city) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_events_featured ON public.events(is_featured) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- Full-text search on events (Portuguese)
CREATE INDEX IF NOT EXISTS idx_events_fts ON public.events
  USING GIN(to_tsvector('portuguese', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(venue_name, '')));

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_event_id_status ON public.orders(event_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_asaas_payment ON public.orders(asaas_payment_id) WHERE asaas_payment_id IS NOT NULL;

-- Tickets
CREATE INDEX IF NOT EXISTS idx_tickets_owner_id ON public.tickets(owner_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_order_id ON public.tickets(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_qr_code ON public.tickets(qr_code);

-- Rate limits cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON public.rate_limits(expires_at);
