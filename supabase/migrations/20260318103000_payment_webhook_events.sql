-- Webhook idempotency + processing audit

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  external_reference TEXT,
  status TEXT NOT NULL DEFAULT 'processing', -- processing | processed | failed
  attempt_count INTEGER NOT NULL DEFAULT 1,
  failure_reason TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  first_received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payment_webhook_events_attempt_count_positive CHECK (attempt_count > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_webhook_events_uniq
  ON public.payment_webhook_events(provider, payment_id, event_type);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_status
  ON public.payment_webhook_events(status, last_received_at DESC);

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read webhook events" ON public.payment_webhook_events
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage webhook events" ON public.payment_webhook_events
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

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
    provider,
    payment_id,
    event_type,
    external_reference,
    status,
    attempt_count,
    payload,
    first_received_at,
    last_received_at
  ) VALUES (
    trim(p_provider),
    trim(p_payment_id),
    trim(p_event_type),
    p_external_reference,
    'processing',
    1,
    COALESCE(p_payload, '{}'::jsonb),
    now(),
    now()
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
