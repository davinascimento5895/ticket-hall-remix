
-- 1) Wallet atomic debit/refund for resale
CREATE OR REPLACE FUNCTION public.wallet_debit_available_atomic(
  p_user_id UUID,
  p_amount NUMERIC,
  p_reference_id UUID,
  p_description TEXT DEFAULT 'Uso de saldo em compra de revenda'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet RECORD;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RETURN jsonb_build_object('error', 'Usuário não autorizado para debitar esta carteira');
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('error', 'Valor inválido para débito em carteira');
  END IF;
  PERFORM public.ensure_user_wallet(p_user_id);
  SELECT * INTO v_wallet
  FROM public.user_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  IF v_wallet.available_balance < p_amount THEN
    RETURN jsonb_build_object(
      'error', 'Saldo insuficiente',
      'available', v_wallet.available_balance,
      'required', p_amount
    );
  END IF;
  UPDATE public.user_wallets
  SET available_balance = available_balance - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
  INSERT INTO public.wallet_ledger (
    user_id, wallet_tx_type, direction, amount, status, balance_bucket,
    reference_type, reference_id, description, metadata
  ) VALUES (
    p_user_id, 'purchase_credit', 'debit', p_amount, 'completed', 'available',
    'resale_order', p_reference_id, p_description,
    jsonb_build_object('source', 'resale_checkout')
  );
  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.wallet_refund_available_atomic(
  p_user_id UUID,
  p_amount NUMERIC,
  p_reference_id UUID,
  p_description TEXT DEFAULT 'Estorno de saldo por falha na liquidação da revenda'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RETURN jsonb_build_object('error', 'Usuário não autorizado para estornar esta carteira');
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('error', 'Valor inválido para estorno em carteira');
  END IF;
  PERFORM public.ensure_user_wallet(p_user_id);
  UPDATE public.user_wallets
  SET available_balance = available_balance + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
  INSERT INTO public.wallet_ledger (
    user_id, wallet_tx_type, direction, amount, status, balance_bucket,
    reference_type, reference_id, description, metadata
  ) VALUES (
    p_user_id, 'purchase_refund', 'credit', p_amount, 'completed', 'available',
    'resale_order', p_reference_id, p_description,
    jsonb_build_object('source', 'resale_checkout_compensation')
  );
  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.wallet_debit_available_atomic(UUID, NUMERIC, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.wallet_refund_available_atomic(UUID, NUMERIC, UUID, TEXT) TO service_role;

-- 2) Webhook idempotency + audit table/functions
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  external_reference TEXT,
  status TEXT NOT NULL DEFAULT 'processing',
  attempt_count INTEGER NOT NULL DEFAULT 1,
  failure_reason TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  first_received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_webhook_events_uniq
  ON public.payment_webhook_events(provider, payment_id, event_type);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_status
  ON public.payment_webhook_events(status, last_received_at DESC);

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_webhook_events'
      AND policyname = 'Admins can read webhook events'
  ) THEN
    CREATE POLICY "Admins can read webhook events" ON public.payment_webhook_events
      FOR SELECT
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_webhook_events'
      AND policyname = 'Service role can manage webhook events'
  ) THEN
    CREATE POLICY "Service role can manage webhook events" ON public.payment_webhook_events
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.register_payment_webhook_event(
  p_provider TEXT,
  p_payment_id TEXT,
  p_event_type TEXT,
  p_external_reference TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row public.payment_webhook_events%ROWTYPE;
BEGIN
  IF p_provider IS NULL OR length(trim(p_provider)) = 0 THEN
    RETURN jsonb_build_object('error', 'provider obrigatório');
  END IF;
  IF p_payment_id IS NULL OR length(trim(p_payment_id)) = 0 THEN
    RETURN jsonb_build_object('error', 'payment_id obrigatório');
  END IF;
  IF p_event_type IS NULL OR length(trim(p_event_type)) = 0 THEN
    RETURN jsonb_build_object('error', 'event_type obrigatório');
  END IF;
  INSERT INTO public.payment_webhook_events (
    provider, payment_id, event_type, external_reference, status,
    attempt_count, payload, first_received_at, last_received_at
  ) VALUES (
    trim(p_provider), trim(p_payment_id), trim(p_event_type),
    p_external_reference, 'processing', 1,
    COALESCE(p_payload, '{}'::jsonb), now(), now()
  )
  ON CONFLICT (provider, payment_id, event_type)
  DO UPDATE
  SET attempt_count = public.payment_webhook_events.attempt_count + 1,
      last_received_at = now(),
      payload = EXCLUDED.payload,
      updated_at = now()
  RETURNING * INTO v_row;
  RETURN jsonb_build_object(
    'success', true,
    'eventId', v_row.id,
    'status', v_row.status,
    'attemptCount', v_row.attempt_count,
    'shouldProcess', v_row.status <> 'processed'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_payment_webhook_event_processed(
  p_event_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.payment_webhook_events
  SET status = 'processed',
      failure_reason = NULL,
      processed_at = now(),
      updated_at = now()
  WHERE id = p_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_payment_webhook_event_failed(
  p_event_id UUID,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.payment_webhook_events
  SET status = 'failed',
      failure_reason = COALESCE(p_failure_reason, 'unknown_error'),
      updated_at = now()
  WHERE id = p_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_payment_webhook_event(TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_payment_webhook_event_processed(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_payment_webhook_event_failed(UUID, TEXT) TO service_role;
