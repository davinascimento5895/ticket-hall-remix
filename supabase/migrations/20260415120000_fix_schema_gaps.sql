-- Migration: Fix schema gaps identified during migration audit
-- Date: 2026-04-15
-- Issues found:
-- 1. wallet_withdrawals missing columns from intended schema in 20260402000001_event_resale_config.sql
-- 2. wallet_withdrawals missing CHECK constraints and index
-- 3. resale_listings missing status CHECK constraint
-- 4. payment_webhook_events missing attempt_count CHECK constraint

-- ============================================
-- 1. WALLET WITHDRAWALS: Missing columns
-- ============================================
ALTER TABLE public.wallet_withdrawals
  ADD COLUMN IF NOT EXISTS expected_payment_date DATE,
  ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS wallet_transaction_id UUID REFERENCES public.wallet_transactions(id);

-- ============================================
-- 2. WALLET WITHDRAWALS: Missing index
-- ============================================
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_processed ON public.wallet_withdrawals(processed_by);

-- ============================================
-- 3. WALLET WITHDRAWALS: Missing CHECK constraints
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'wallet_withdrawals_pix_key_type_check'
      AND conrelid = 'public.wallet_withdrawals'::regclass
  ) THEN
    ALTER TABLE public.wallet_withdrawals
      ADD CONSTRAINT wallet_withdrawals_pix_key_type_check
      CHECK (pix_key_type IN ('cpf', 'email', 'phone', 'random'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'wallet_withdrawals_status_check'
      AND conrelid = 'public.wallet_withdrawals'::regclass
  ) THEN
    ALTER TABLE public.wallet_withdrawals
      ADD CONSTRAINT wallet_withdrawals_status_check
      CHECK (status IN ('requested', 'under_review', 'processing', 'paid', 'failed', 'cancelled'));
  END IF;
END $$;

-- ============================================
-- 4. RESALE LISTINGS: Missing CHECK constraint
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'resale_listings_status_check'
      AND conrelid = 'public.resale_listings'::regclass
  ) THEN
    ALTER TABLE public.resale_listings
      ADD CONSTRAINT resale_listings_status_check
      CHECK (status IN ('active', 'sold', 'cancelled', 'expired'));
  END IF;
END $$;

-- ============================================
-- 5. PAYMENT WEBHOOK EVENTS: Missing CHECK constraint
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payment_webhook_events_attempt_count_positive'
      AND conrelid = 'public.payment_webhook_events'::regclass
  ) THEN
    ALTER TABLE public.payment_webhook_events
      ADD CONSTRAINT payment_webhook_events_attempt_count_positive
      CHECK (attempt_count > 0);
  END IF;
END $$;
