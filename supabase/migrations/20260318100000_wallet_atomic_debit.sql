-- Atomic wallet operations for resale checkout wallet-credit path

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
    user_id,
    wallet_tx_type,
    direction,
    amount,
    status,
    balance_bucket,
    reference_type,
    reference_id,
    description,
    metadata
  ) VALUES (
    p_user_id,
    'purchase_credit',
    'debit',
    p_amount,
    'completed',
    'available',
    'resale_order',
    p_reference_id,
    p_description,
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
    user_id,
    wallet_tx_type,
    direction,
    amount,
    status,
    balance_bucket,
    reference_type,
    reference_id,
    description,
    metadata
  ) VALUES (
    p_user_id,
    'purchase_refund',
    'credit',
    p_amount,
    'completed',
    'available',
    'resale_order',
    p_reference_id,
    p_description,
    jsonb_build_object('source', 'resale_checkout_compensation')
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.wallet_debit_available_atomic(UUID, NUMERIC, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.wallet_refund_available_atomic(UUID, NUMERIC, UUID, TEXT) TO service_role;
