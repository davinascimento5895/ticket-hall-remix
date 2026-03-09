
-- ============================================================
-- FINANCIAL TABLES
-- ============================================================

-- Bank accounts for producers
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  bank_name TEXT,
  agency TEXT,
  account_number TEXT,
  pix_key TEXT,
  pix_key_type TEXT, -- cpf, email, phone, random
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Producers can manage their bank accounts" ON public.bank_accounts
  FOR ALL USING (auth.uid() = producer_id) WITH CHECK (auth.uid() = producer_id);

CREATE POLICY "Admins can manage all bank accounts" ON public.bank_accounts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Financial transactions (accounts payable/receivable)
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'receivable' or 'payable'
  category TEXT NOT NULL, -- 'ticket_sale', 'refund', 'commission', 'platform_fee', 'payout', 'other'
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'paid', 'cancelled'
  due_date DATE,
  paid_at TIMESTAMPTZ,
  reference_id TEXT, -- external payment reference
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Producers can manage their financial transactions" ON public.financial_transactions
  FOR ALL USING (auth.uid() = producer_id) WITH CHECK (auth.uid() = producer_id);

CREATE POLICY "Admins can manage all financial transactions" ON public.financial_transactions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- PROMOTER TABLES (extends affiliates concept)
-- ============================================================

-- Promoters are people who sell tickets for the producer across events
CREATE TABLE public.promoters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  pix_key TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'blocked'
  notes TEXT,
  total_sales NUMERIC DEFAULT 0,
  total_commission_earned NUMERIC DEFAULT 0,
  total_commission_paid NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.promoters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Producers can manage their promoters" ON public.promoters
  FOR ALL USING (auth.uid() = producer_id) WITH CHECK (auth.uid() = producer_id);

CREATE POLICY "Admins can manage all promoters" ON public.promoters
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Promoter event assignments (which events a promoter is selling for)
CREATE TABLE public.promoter_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promoter_id UUID NOT NULL REFERENCES public.promoters(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  commission_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  commission_value NUMERIC NOT NULL DEFAULT 0,
  tracking_code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_generated NUMERIC DEFAULT 0,
  commission_total NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(promoter_id, event_id)
);

ALTER TABLE public.promoter_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Producers can manage their promoter events" ON public.promoter_events
  FOR ALL USING (auth.uid() = producer_id) WITH CHECK (auth.uid() = producer_id);

CREATE POLICY "Admins can manage all promoter events" ON public.promoter_events
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Commission records per order
CREATE TABLE public.promoter_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promoter_id UUID NOT NULL REFERENCES public.promoters(id) ON DELETE CASCADE,
  promoter_event_id UUID NOT NULL REFERENCES public.promoter_events(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  order_amount NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'cancelled'
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.promoter_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Producers can manage their promoter commissions" ON public.promoter_commissions
  FOR ALL USING (auth.uid() = producer_id) WITH CHECK (auth.uid() = producer_id);

CREATE POLICY "Admins can manage all promoter commissions" ON public.promoter_commissions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
