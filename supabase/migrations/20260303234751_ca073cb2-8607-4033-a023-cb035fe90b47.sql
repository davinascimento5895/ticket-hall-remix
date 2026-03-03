
-- ============================================
-- BLOCO 1.1: Schema changes for Asaas integration
-- ============================================

-- Add Asaas columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS asaas_wallet_id TEXT,
  ADD COLUMN IF NOT EXISTS asaas_account_id TEXT,
  ADD COLUMN IF NOT EXISTS asaas_account_key TEXT;

-- Add Asaas/financial columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS net_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS installment_value NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS chargeback_status TEXT,
  ADD COLUMN IF NOT EXISTS chargeback_reason TEXT,
  ADD COLUMN IF NOT EXISTS chargeback_notified_at TIMESTAMPTZ;

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL
);

-- RLS on rate_limits (service role only — no public access)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
