-- ============================================================
-- SCHEMA RECOVERY SCRIPT: Aplica todas as alterações pendentes
-- na tabela public.profiles e outras estruturas críticas.
-- Execute isto no SQL Editor do Supabase Dashboard.
-- ============================================================

-- --------------------------------------------------
-- 1. Colunas do profiles adicionadas em migrations posteriores
-- --------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS preferred_categories TEXT[];

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organizer_slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS organizer_bio TEXT,
  ADD COLUMN IF NOT EXISTS organizer_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS organizer_banner_url TEXT,
  ADD COLUMN IF NOT EXISTS organizer_website TEXT,
  ADD COLUMN IF NOT EXISTS organizer_instagram TEXT,
  ADD COLUMN IF NOT EXISTS organizer_facebook TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS asaas_wallet_id TEXT,
  ADD COLUMN IF NOT EXISTS asaas_account_id TEXT,
  ADD COLUMN IF NOT EXISTS asaas_account_key TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cnpj TEXT;

-- --------------------------------------------------
-- 2. Tabelas auxiliares que o código atual espera existir
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.capacity_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  sold_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.capacity_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Producers can manage their capacity groups" ON public.capacity_groups FOR ALL
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = capacity_groups.event_id AND events.producer_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Admins can manage all capacity groups" ON public.capacity_groups FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY IF NOT EXISTS "Anyone can view capacity groups for published events" ON public.capacity_groups FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = capacity_groups.event_id AND events.status = 'published'));

ALTER TABLE public.ticket_tiers
  DROP CONSTRAINT IF EXISTS ticket_tiers_capacity_group_id_fkey,
  ADD COLUMN IF NOT EXISTS capacity_group_id UUID,
  ADD COLUMN IF NOT EXISTS is_hidden_by_default BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS unlock_code TEXT;
ALTER TABLE public.ticket_tiers
  ADD CONSTRAINT ticket_tiers_capacity_group_id_fkey FOREIGN KEY (capacity_group_id) REFERENCES public.capacity_groups(id);

CREATE TABLE IF NOT EXISTS public.checkin_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  allowed_tier_ids UUID[],
  access_code TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.checkin_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Producers can manage their checkin lists" ON public.checkin_lists FOR ALL
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = checkin_lists.event_id AND events.producer_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Admins can manage all checkin lists" ON public.checkin_lists FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY IF NOT EXISTS "Anyone can view active checkin lists by access_code" ON public.checkin_lists FOR SELECT
  USING (is_active = true);

CREATE TABLE IF NOT EXISTS public.checkin_scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_list_id UUID REFERENCES public.checkin_lists(id),
  ticket_id UUID REFERENCES public.tickets(id),
  qr_code_scanned TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('success', 'already_used', 'invalid', 'wrong_list', 'not_found')),
  scanned_by UUID REFERENCES public.profiles(id),
  device_id TEXT,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.checkin_scan_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Staff can insert scan logs" ON public.checkin_scan_logs FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Producers can view scan logs for their events" ON public.checkin_scan_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.checkin_lists cl JOIN public.events e ON e.id = cl.event_id WHERE cl.id = checkin_scan_logs.checkin_list_id AND e.producer_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Admins can manage all scan logs" ON public.checkin_scan_logs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id),
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Producers can manage their webhooks" ON public.webhooks FOR ALL USING (auth.uid() = producer_id);
CREATE POLICY IF NOT EXISTS "Admins can manage all webhooks" ON public.webhooks FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Producers can view their webhook deliveries" ON public.webhook_deliveries FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.webhooks WHERE webhooks.id = webhook_deliveries.webhook_id AND webhooks.producer_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Admins can manage all deliveries" ON public.webhook_deliveries FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.bulk_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  producer_id UUID NOT NULL REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  recipient_filter JSONB,
  recipients_count INTEGER,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.bulk_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Producers can manage their messages" ON public.bulk_messages FOR ALL USING (auth.uid() = producer_id);
CREATE POLICY IF NOT EXISTS "Admins can manage all messages" ON public.bulk_messages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  ticket_ids UUID[],
  amount NUMERIC(10,2) NOT NULL,
  platform_fee_refunded NUMERIC(10,2) DEFAULT 0,
  reason TEXT,
  initiated_by UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  gateway_refund_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Producers can manage refunds for their events" ON public.refunds FOR ALL
  USING (EXISTS (SELECT 1 FROM public.orders o JOIN public.events e ON e.id = o.event_id WHERE o.id = refunds.order_id AND e.producer_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Buyers can view their refunds" ON public.refunds FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = refunds.order_id AND orders.buyer_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Admins can manage all refunds" ON public.refunds FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  producer_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  commission_type TEXT CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value NUMERIC(10,2) DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_generated NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Producers can manage their affiliates" ON public.affiliates FOR ALL USING (auth.uid() = producer_id);
CREATE POLICY IF NOT EXISTS "Admins can manage all affiliates" ON public.affiliates FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY IF NOT EXISTS "Anyone can view active affiliates" ON public.affiliates FOR SELECT USING (is_active = true);

CREATE TABLE IF NOT EXISTS public.event_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  quantity_available INTEGER,
  quantity_sold INTEGER DEFAULT 0,
  max_per_order INTEGER DEFAULT 10,
  is_visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.event_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Producers can manage their products" ON public.event_products FOR ALL
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_products.event_id AND events.producer_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Admins can manage all products" ON public.event_products FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY IF NOT EXISTS "Anyone can view products for published events" ON public.event_products FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_products.event_id AND events.status = 'published'));

CREATE TABLE IF NOT EXISTS public.order_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.event_products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.order_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Buyers can insert their order products" ON public.order_products FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_products.order_id AND orders.buyer_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Buyers can view their order products" ON public.order_products FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_products.order_id AND orders.buyer_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Producers can view order products for their events" ON public.order_products FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o JOIN public.events e ON e.id = o.event_id WHERE o.id = order_products.order_id AND e.producer_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Admins can manage all order products" ON public.order_products FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.producer_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'checkin_staff', 'reports_only')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  invite_token TEXT UNIQUE,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);
ALTER TABLE public.producer_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Producers can manage their team" ON public.producer_team_members FOR ALL USING (auth.uid() = producer_id);
CREATE POLICY IF NOT EXISTS "Team members can view their membership" ON public.producer_team_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Admins can manage all teams" ON public.producer_team_members FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------
-- 3. Outras colunas importantes em tabelas existentes
-- --------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_reason TEXT,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS invoice_issued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invoice_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS billing_company_name TEXT,
  ADD COLUMN IF NOT EXISTS billing_cnpj TEXT,
  ADD COLUMN IF NOT EXISTS billing_address TEXT,
  ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS net_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS installment_value NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS chargeback_status TEXT,
  ADD COLUMN IF NOT EXISTS chargeback_reason TEXT,
  ADD COLUMN IF NOT EXISTS chargeback_notified_at TIMESTAMPTZ;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  ADD COLUMN IF NOT EXISTS online_platform TEXT DEFAULT 'external';
