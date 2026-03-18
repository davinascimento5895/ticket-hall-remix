-- ============================================================
-- RESALE: END-TO-END PAYMENT + WALLET + WITHDRAWAL
-- ============================================================

-- 1) Extend resale_listings to support reservation and order linkage
ALTER TABLE public.resale_listings
  ADD COLUMN IF NOT EXISTS reserved_by UUID,
  ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sold_order_id UUID,
  ADD COLUMN IF NOT EXISTS cancelled_reason TEXT;

-- 2) Resale payment lifecycle table
CREATE TABLE IF NOT EXISTS public.resale_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.resale_listings(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending_payment', -- pending_payment | payment_processing | paid | settled | cancelled | expired | refunded | chargeback | disputed
  payment_method TEXT,
  asaas_payment_id TEXT,
  asaas_payment_status TEXT,
  amount_gross NUMERIC NOT NULL DEFAULT 0,
  platform_fee_amount NUMERIC NOT NULL DEFAULT 0,
  seller_net_amount NUMERIC NOT NULL DEFAULT 0,
  wallet_credit_amount NUMERIC NOT NULL DEFAULT 0,
  pix_qr_code TEXT,
  pix_qr_code_image TEXT,
  boleto_url TEXT,
  boleto_barcode TEXT,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  chargeback_at TIMESTAMPTZ,
  failure_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.resale_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their resale orders" ON public.resale_orders
  FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view their resale orders" ON public.resale_orders
  FOR SELECT TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all resale orders" ON public.resale_orders
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_resale_orders_listing ON public.resale_orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_resale_orders_buyer ON public.resale_orders(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resale_orders_seller ON public.resale_orders(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resale_orders_status ON public.resale_orders(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_resale_orders_asaas_payment_id ON public.resale_orders(asaas_payment_id) WHERE asaas_payment_id IS NOT NULL;

-- Link sold listing to resale_order after table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'resale_listings_sold_order_id_fkey'
  ) THEN
    ALTER TABLE public.resale_listings
      ADD CONSTRAINT resale_listings_sold_order_id_fkey
      FOREIGN KEY (sold_order_id) REFERENCES public.resale_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3) Wallet model for end users (sellers in marketplace)
CREATE TABLE IF NOT EXISTS public.user_wallets (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  available_balance NUMERIC NOT NULL DEFAULT 0,
  pending_balance NUMERIC NOT NULL DEFAULT 0,
  locked_balance NUMERIC NOT NULL DEFAULT 0,
  total_earned NUMERIC NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.user_wallets
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all wallets" ON public.user_wallets
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  wallet_tx_type TEXT NOT NULL, -- resale_sale_credit | resale_reversal | withdrawal_request | withdrawal_paid | withdrawal_failed | purchase_credit | manual_adjustment
  direction TEXT NOT NULL, -- credit | debit
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | available | locked | completed | reversed | cancelled
  balance_bucket TEXT NOT NULL, -- pending | available | locked
  reference_type TEXT NOT NULL, -- resale_order | withdrawal | order | manual
  reference_id UUID,
  description TEXT NOT NULL,
  available_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT wallet_ledger_amount_positive CHECK (amount > 0)
);

ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet ledger" ON public.wallet_ledger
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all wallet ledger" ON public.wallet_ledger
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_created ON public.wallet_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_reference ON public.wallet_ledger(reference_type, reference_id);

CREATE TABLE IF NOT EXISTS public.wallet_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  fee_amount NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested', -- requested | under_review | processing | paid | failed | cancelled
  pix_key TEXT NOT NULL,
  pix_key_type TEXT,
  asaas_transfer_id TEXT,
  failure_reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT wallet_withdrawals_amount_positive CHECK (amount > 0),
  CONSTRAINT wallet_withdrawals_net_positive CHECK (net_amount > 0)
);

ALTER TABLE public.wallet_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawals" ON public.wallet_withdrawals
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all withdrawals" ON public.wallet_withdrawals
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_user_created ON public.wallet_withdrawals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_status ON public.wallet_withdrawals(status);

-- 4) Timestamp trigger helper reuse
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_resale_orders_updated_at ON public.resale_orders;
CREATE TRIGGER set_resale_orders_updated_at
  BEFORE UPDATE ON public.resale_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_user_wallets_updated_at ON public.user_wallets;
CREATE TRIGGER set_user_wallets_updated_at
  BEFORE UPDATE ON public.user_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_wallet_ledger_updated_at ON public.wallet_ledger;
CREATE TRIGGER set_wallet_ledger_updated_at
  BEFORE UPDATE ON public.wallet_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_wallet_withdrawals_updated_at ON public.wallet_withdrawals;
CREATE TRIGGER set_wallet_withdrawals_updated_at
  BEFORE UPDATE ON public.wallet_withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_timestamp();

-- 5) Utility function to ensure wallet exists
CREATE OR REPLACE FUNCTION public.ensure_user_wallet(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_wallets (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- 6) Reserve listing and create resale order atomically
CREATE OR REPLACE FUNCTION public.create_resale_order_atomic(
  p_listing_id UUID,
  p_buyer_id UUID,
  p_payment_method TEXT,
  p_reservation_minutes INTEGER DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_listing RECORD;
  v_ticket RECORD;
  v_order RECORD;
  v_expiry TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_buyer_id THEN
    RETURN jsonb_build_object('error', 'Usuário não autorizado para criar ordem de revenda');
  END IF;

  IF p_payment_method IS NULL OR p_payment_method NOT IN ('pix', 'boleto', 'credit_card') THEN
    RETURN jsonb_build_object('error', 'Método de pagamento inválido');
  END IF;

  SELECT * INTO v_listing
  FROM public.resale_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF v_listing IS NULL THEN
    RETURN jsonb_build_object('error', 'Anúncio não encontrado');
  END IF;

  IF v_listing.status = 'sold' THEN
    RETURN jsonb_build_object('error', 'Este anúncio já foi vendido');
  END IF;

  IF v_listing.seller_id = p_buyer_id THEN
    RETURN jsonb_build_object('error', 'Você não pode comprar seu próprio ingresso');
  END IF;

  IF v_listing.expires_at < now() OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = v_listing.event_id AND e.start_date < now()
  ) THEN
    UPDATE public.resale_listings
    SET status = 'expired', reserved_by = NULL, reserved_until = NULL, updated_at = now()
    WHERE id = v_listing.id;

    UPDATE public.tickets
    SET is_for_resale = false, resale_price = NULL
    WHERE id = v_listing.ticket_id;

    RETURN jsonb_build_object('error', 'Anúncio expirado');
  END IF;

  IF v_listing.status = 'reserved'
     AND v_listing.reserved_until IS NOT NULL
     AND v_listing.reserved_until > now()
     AND v_listing.reserved_by IS DISTINCT FROM p_buyer_id THEN
    RETURN jsonb_build_object('error', 'Este anúncio está em checkout por outro usuário');
  END IF;

  SELECT * INTO v_ticket
  FROM public.tickets
  WHERE id = v_listing.ticket_id
  FOR UPDATE;

  IF v_ticket IS NULL OR v_ticket.status <> 'active' THEN
    RETURN jsonb_build_object('error', 'Ingresso não disponível');
  END IF;

  IF p_reservation_minutes IS NULL OR p_reservation_minutes < 3 THEN
    p_reservation_minutes := 15;
  END IF;
  IF p_reservation_minutes > 30 THEN
    p_reservation_minutes := 30;
  END IF;

  v_expiry := now() + make_interval(mins => p_reservation_minutes);

  SELECT * INTO v_order
  FROM public.resale_orders
  WHERE listing_id = p_listing_id
    AND buyer_id = p_buyer_id
    AND status IN ('pending_payment', 'payment_processing')
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_order IS NOT NULL THEN
    UPDATE public.resale_listings
    SET status = 'reserved', reserved_by = p_buyer_id, reserved_until = v_expiry, updated_at = now()
    WHERE id = p_listing_id;

    UPDATE public.resale_orders
    SET payment_method = p_payment_method,
        expires_at = v_expiry,
        updated_at = now()
    WHERE id = v_order.id;

    RETURN jsonb_build_object(
      'success', true,
      'alreadyExists', true,
      'resaleOrderId', v_order.id,
      'amountGross', v_order.amount_gross,
      'platformFee', v_order.platform_fee_amount,
      'sellerNet', v_order.seller_net_amount,
      'expiresAt', v_expiry
    );
  END IF;

  UPDATE public.resale_listings
  SET status = 'reserved',
      reserved_by = p_buyer_id,
      reserved_until = v_expiry,
      updated_at = now()
  WHERE id = p_listing_id;

  INSERT INTO public.resale_orders (
    listing_id,
    ticket_id,
    event_id,
    buyer_id,
    seller_id,
    status,
    payment_method,
    amount_gross,
    platform_fee_amount,
    seller_net_amount,
    wallet_credit_amount,
    expires_at
  ) VALUES (
    v_listing.id,
    v_listing.ticket_id,
    v_listing.event_id,
    p_buyer_id,
    v_listing.seller_id,
    'pending_payment',
    p_payment_method,
    v_listing.asking_price,
    COALESCE(v_listing.platform_fee_amount, ROUND(v_listing.asking_price * 0.10, 2)),
    COALESCE(v_listing.seller_receives, ROUND(v_listing.asking_price - ROUND(v_listing.asking_price * 0.10, 2), 2)),
    COALESCE(v_listing.seller_receives, ROUND(v_listing.asking_price - ROUND(v_listing.asking_price * 0.10, 2), 2)),
    v_expiry
  )
  RETURNING * INTO v_order;

  RETURN jsonb_build_object(
    'success', true,
    'resaleOrderId', v_order.id,
    'amountGross', v_order.amount_gross,
    'platformFee', v_order.platform_fee_amount,
    'sellerNet', v_order.seller_net_amount,
    'expiresAt', v_expiry
  );
END;
$$;

-- 7) Settlement after payment confirmation
CREATE OR REPLACE FUNCTION public.settle_resale_order_atomic(
  p_resale_order_id UUID,
  p_buyer_email TEXT,
  p_asaas_payment_id TEXT,
  p_asaas_payment_status TEXT,
  p_new_qr_code TEXT,
  p_new_qr_image_url TEXT,
  p_paid_at TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order RECORD;
  v_listing RECORD;
  v_ticket RECORD;
  v_event RECORD;
  v_existing_history JSONB;
  v_transfer_entry JSONB;
  v_wallet_entry_id UUID;
  v_available_at TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_order
  FROM public.resale_orders
  WHERE id = p_resale_order_id
  FOR UPDATE;

  IF v_order IS NULL THEN
    RETURN jsonb_build_object('error', 'Ordem de revenda não encontrada');
  END IF;

  IF v_order.status = 'settled' THEN
    RETURN jsonb_build_object('success', true, 'idempotent', true, 'resaleOrderId', v_order.id);
  END IF;

  IF v_order.status IN ('cancelled', 'expired', 'refunded', 'chargeback', 'disputed') THEN
    RETURN jsonb_build_object('error', 'Ordem de revenda não pode ser liquidada no status atual');
  END IF;

  SELECT * INTO v_listing
  FROM public.resale_listings
  WHERE id = v_order.listing_id
  FOR UPDATE;

  IF v_listing IS NULL THEN
    RETURN jsonb_build_object('error', 'Anúncio da revenda não encontrado');
  END IF;

  SELECT * INTO v_ticket
  FROM public.tickets
  WHERE id = v_order.ticket_id
  FOR UPDATE;

  IF v_ticket IS NULL THEN
    RETURN jsonb_build_object('error', 'Ingresso da revenda não encontrado');
  END IF;

  IF v_ticket.status <> 'active' THEN
    RETURN jsonb_build_object('error', 'Ingresso não está ativo para transferência');
  END IF;

  IF v_ticket.owner_id = v_order.buyer_id AND v_listing.status = 'sold' AND v_listing.sold_order_id = v_order.id THEN
    UPDATE public.resale_orders
    SET status = 'settled',
        asaas_payment_id = COALESCE(asaas_payment_id, p_asaas_payment_id),
        asaas_payment_status = COALESCE(p_asaas_payment_status, asaas_payment_status),
        paid_at = COALESCE(p_paid_at, paid_at, now()),
        settled_at = COALESCE(settled_at, now()),
        updated_at = now()
    WHERE id = v_order.id;

    RETURN jsonb_build_object('success', true, 'idempotent', true, 'resaleOrderId', v_order.id);
  END IF;

  SELECT start_date INTO v_event
  FROM public.events
  WHERE id = v_order.event_id;

  v_available_at := GREATEST(now(), COALESCE(v_event.start_date, now()) + interval '7 days');

  v_existing_history := COALESCE(v_ticket.transfer_history::jsonb, '[]'::jsonb);
  v_transfer_entry := jsonb_build_object(
    'type', 'resale',
    'from', v_order.seller_id,
    'to', v_order.buyer_id,
    'at', now(),
    'price', v_order.amount_gross,
    'platformFee', v_order.platform_fee_amount,
    'resaleOrderId', v_order.id,
    'paymentId', p_asaas_payment_id
  );

  UPDATE public.tickets
  SET owner_id = v_order.buyer_id,
      qr_code = p_new_qr_code,
      qr_code_image_url = p_new_qr_image_url,
      attendee_name = NULL,
      attendee_email = p_buyer_email,
      attendee_cpf = NULL,
      transfer_history = v_existing_history || v_transfer_entry,
      is_for_resale = false,
      resale_price = NULL,
      updated_at = now()
  WHERE id = v_order.ticket_id;

  UPDATE public.resale_listings
  SET status = 'sold',
      buyer_id = v_order.buyer_id,
      sold_at = now(),
      sold_order_id = v_order.id,
      reserved_by = NULL,
      reserved_until = NULL,
      updated_at = now()
  WHERE id = v_order.listing_id;

  UPDATE public.resale_orders
  SET status = 'settled',
      asaas_payment_id = COALESCE(p_asaas_payment_id, asaas_payment_id),
      asaas_payment_status = COALESCE(p_asaas_payment_status, asaas_payment_status, 'RECEIVED'),
      paid_at = COALESCE(p_paid_at, paid_at, now()),
      settled_at = now(),
      updated_at = now()
  WHERE id = v_order.id;

  PERFORM public.ensure_user_wallet(v_order.seller_id);

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
    available_at,
    metadata
  ) VALUES (
    v_order.seller_id,
    'resale_sale_credit',
    'credit',
    v_order.wallet_credit_amount,
    'pending',
    'pending',
    'resale_order',
    v_order.id,
    'Crédito de venda em revenda oficial',
    v_available_at,
    jsonb_build_object(
      'listingId', v_order.listing_id,
      'ticketId', v_order.ticket_id,
      'gross', v_order.amount_gross,
      'platformFee', v_order.platform_fee_amount,
      'net', v_order.wallet_credit_amount
    )
  ) RETURNING id INTO v_wallet_entry_id;

  UPDATE public.user_wallets
  SET pending_balance = pending_balance + v_order.wallet_credit_amount,
      total_earned = total_earned + v_order.wallet_credit_amount,
      updated_at = now()
  WHERE user_id = v_order.seller_id;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES
    (
      v_order.seller_id,
      'resale_sold',
      'Ingresso vendido!',
      'Sua venda foi confirmada. Valor líquido de R$ ' || to_char(v_order.wallet_credit_amount, 'FM999999990.00') || ' creditado na sua carteira (pendente).',
      jsonb_build_object(
        'resaleOrderId', v_order.id,
        'listingId', v_order.listing_id,
        'ticketId', v_order.ticket_id,
        'walletEntryId', v_wallet_entry_id
      )
    ),
    (
      v_order.buyer_id,
      'resale_purchased',
      'Ingresso adquirido com sucesso!',
      'A compra foi confirmada e um novo QR Code exclusivo foi emitido.',
      jsonb_build_object(
        'resaleOrderId', v_order.id,
        'listingId', v_order.listing_id,
        'ticketId', v_order.ticket_id
      )
    );

  RETURN jsonb_build_object(
    'success', true,
    'resaleOrderId', v_order.id,
    'ticketId', v_order.ticket_id,
    'total', v_order.amount_gross,
    'platformFee', v_order.platform_fee_amount,
    'sellerReceives', v_order.wallet_credit_amount,
    'walletAvailableAt', v_available_at
  );
END;
$$;

-- 8) Reverse settlement on refund/chargeback with wallet correction
CREATE OR REPLACE FUNCTION public.reverse_resale_order_atomic(
  p_resale_order_id UUID,
  p_reason TEXT DEFAULT 'refund'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order RECORD;
  v_listing RECORD;
  v_ticket RECORD;
  v_entry RECORD;
  v_remaining NUMERIC;
  v_wallet RECORD;
  v_take NUMERIC;
BEGIN
  SELECT * INTO v_order
  FROM public.resale_orders
  WHERE id = p_resale_order_id
  FOR UPDATE;

  IF v_order IS NULL THEN
    RETURN jsonb_build_object('error', 'Ordem de revenda não encontrada');
  END IF;

  IF v_order.status IN ('refunded', 'chargeback', 'disputed') THEN
    RETURN jsonb_build_object('success', true, 'idempotent', true, 'status', v_order.status);
  END IF;

  SELECT * INTO v_listing
  FROM public.resale_listings
  WHERE id = v_order.listing_id
  FOR UPDATE;

  SELECT * INTO v_ticket
  FROM public.tickets
  WHERE id = v_order.ticket_id
  FOR UPDATE;

  IF v_order.status IN ('pending_payment', 'payment_processing', 'paid') THEN
    UPDATE public.resale_orders
    SET status = CASE WHEN p_reason ILIKE '%chargeback%' THEN 'chargeback' ELSE 'refunded' END,
        failure_reason = p_reason,
        refunded_at = CASE WHEN p_reason ILIKE '%chargeback%' THEN refunded_at ELSE now() END,
        chargeback_at = CASE WHEN p_reason ILIKE '%chargeback%' THEN now() ELSE chargeback_at END,
        updated_at = now()
    WHERE id = v_order.id;

    IF v_listing IS NOT NULL AND v_listing.status = 'reserved' THEN
      UPDATE public.resale_listings
      SET status = 'active',
          reserved_by = NULL,
          reserved_until = NULL,
          updated_at = now()
      WHERE id = v_listing.id;
    END IF;

    RETURN jsonb_build_object('success', true, 'status', 'reverted_without_settlement');
  END IF;

  UPDATE public.resale_orders
  SET status = CASE WHEN p_reason ILIKE '%chargeback%' THEN 'chargeback' ELSE 'refunded' END,
      failure_reason = p_reason,
      refunded_at = CASE WHEN p_reason ILIKE '%chargeback%' THEN refunded_at ELSE now() END,
      chargeback_at = CASE WHEN p_reason ILIKE '%chargeback%' THEN now() ELSE chargeback_at END,
      updated_at = now()
  WHERE id = v_order.id;

  IF v_listing IS NOT NULL THEN
    UPDATE public.resale_listings
    SET status = 'disputed',
        cancelled_reason = p_reason,
        reserved_by = NULL,
        reserved_until = NULL,
        updated_at = now()
    WHERE id = v_listing.id;
  END IF;

  IF v_ticket IS NOT NULL AND v_ticket.status = 'active' THEN
    UPDATE public.tickets
    SET status = 'suspended',
        updated_at = now()
    WHERE id = v_ticket.id;
  END IF;

  SELECT * INTO v_entry
  FROM public.wallet_ledger
  WHERE reference_type = 'resale_order'
    AND reference_id = v_order.id
    AND wallet_tx_type = 'resale_sale_credit'
    AND direction = 'credit'
    AND status IN ('pending', 'available')
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_entry IS NOT NULL THEN
    PERFORM public.ensure_user_wallet(v_order.seller_id);

    v_remaining := v_entry.amount;

    SELECT * INTO v_wallet
    FROM public.user_wallets
    WHERE user_id = v_order.seller_id
    FOR UPDATE;

    IF v_entry.status = 'available' THEN
      v_take := LEAST(COALESCE(v_wallet.available_balance, 0), v_remaining);

      UPDATE public.user_wallets
      SET available_balance = GREATEST(0, available_balance - v_take),
          updated_at = now()
      WHERE user_id = v_order.seller_id;

      v_remaining := GREATEST(0, v_remaining - v_take);

      IF v_remaining > 0 THEN
        v_take := LEAST(COALESCE(v_wallet.pending_balance, 0), v_remaining);
        UPDATE public.user_wallets
        SET pending_balance = GREATEST(0, pending_balance - v_take),
            updated_at = now()
        WHERE user_id = v_order.seller_id;
        v_remaining := GREATEST(0, v_remaining - v_take);
      END IF;
    ELSE
      v_take := LEAST(COALESCE(v_wallet.pending_balance, 0), v_remaining);

      UPDATE public.user_wallets
      SET pending_balance = GREATEST(0, pending_balance - v_take),
          updated_at = now()
      WHERE user_id = v_order.seller_id;

      v_remaining := GREATEST(0, v_remaining - v_take);

      IF v_remaining > 0 THEN
        v_take := LEAST(COALESCE(v_wallet.available_balance, 0), v_remaining);
        UPDATE public.user_wallets
        SET available_balance = GREATEST(0, available_balance - v_take),
            updated_at = now()
        WHERE user_id = v_order.seller_id;
        v_remaining := GREATEST(0, v_remaining - v_take);
      END IF;
    END IF;

    IF v_remaining > 0 THEN
      UPDATE public.user_wallets
      SET locked_balance = locked_balance + v_remaining,
          updated_at = now()
      WHERE user_id = v_order.seller_id;

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
        v_order.seller_id,
        'resale_recovery_debt',
        'debit',
        v_remaining,
        'locked',
        'locked',
        'resale_order',
        v_order.id,
        'Bloqueio por reversão de revenda já utilizada em saldo',
        jsonb_build_object('reason', p_reason)
      );
    END IF;

    UPDATE public.wallet_ledger
    SET status = 'reversed',
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('reversalReason', p_reason, 'reversedAt', now()),
        updated_at = now()
    WHERE id = v_entry.id;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES
    (
      v_order.seller_id,
      'resale_reversed',
      'Venda em revisão',
      'A venda do ingresso entrou em revisão por estorno/chargeback.',
      jsonb_build_object('resaleOrderId', v_order.id, 'reason', p_reason)
    ),
    (
      v_order.buyer_id,
      'resale_disputed',
      'Compra em revisão',
      'A compra em revenda foi sinalizada para revisão de pagamento.',
      jsonb_build_object('resaleOrderId', v_order.id, 'reason', p_reason)
    );

  RETURN jsonb_build_object('success', true, 'status', 'reversed');
END;
$$;

-- 9) Move pending wallet credits to available when due date is reached
CREATE OR REPLACE FUNCTION public.release_wallet_credits_due()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER := 0;
  v_row RECORD;
BEGIN
  FOR v_row IN
    SELECT id, user_id, amount
    FROM public.wallet_ledger
    WHERE status = 'pending'
      AND balance_bucket = 'pending'
      AND available_at IS NOT NULL
      AND available_at <= now()
    FOR UPDATE
  LOOP
    UPDATE public.wallet_ledger
    SET status = 'available',
        balance_bucket = 'available',
        updated_at = now()
    WHERE id = v_row.id;

    PERFORM public.ensure_user_wallet(v_row.user_id);

    UPDATE public.user_wallets
    SET pending_balance = GREATEST(0, pending_balance - v_row.amount),
        available_balance = available_balance + v_row.amount,
        updated_at = now()
    WHERE user_id = v_row.user_id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 10) Withdraw request (debit available -> lock until processed)
CREATE OR REPLACE FUNCTION public.request_wallet_withdrawal_atomic(
  p_user_id UUID,
  p_amount NUMERIC,
  p_pix_key TEXT,
  p_pix_key_type TEXT DEFAULT 'random'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet RECORD;
  v_withdrawal RECORD;
  v_fee NUMERIC;
  v_net NUMERIC;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RETURN jsonb_build_object('error', 'Usuário não autorizado para solicitar saque nesta carteira');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('error', 'Valor de saque inválido');
  END IF;

  IF p_pix_key IS NULL OR length(trim(p_pix_key)) < 3 THEN
    RETURN jsonb_build_object('error', 'Chave PIX inválida');
  END IF;

  PERFORM public.ensure_user_wallet(p_user_id);

  SELECT * INTO v_wallet
  FROM public.user_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_wallet.available_balance < p_amount THEN
    RETURN jsonb_build_object('error', 'Saldo disponível insuficiente');
  END IF;

  v_fee := ROUND(GREATEST(1, p_amount * 0.01), 2);
  v_net := ROUND(p_amount - v_fee, 2);

  IF v_net <= 0 THEN
    RETURN jsonb_build_object('error', 'Valor líquido inválido para saque');
  END IF;

  INSERT INTO public.wallet_withdrawals (
    user_id,
    amount,
    fee_amount,
    net_amount,
    status,
    pix_key,
    pix_key_type
  ) VALUES (
    p_user_id,
    p_amount,
    v_fee,
    v_net,
    'requested',
    trim(p_pix_key),
    COALESCE(p_pix_key_type, 'random')
  ) RETURNING * INTO v_withdrawal;

  UPDATE public.user_wallets
  SET available_balance = available_balance - p_amount,
      locked_balance = locked_balance + p_amount,
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
    'withdrawal_request',
    'debit',
    p_amount,
    'locked',
    'locked',
    'withdrawal',
    v_withdrawal.id,
    'Solicitação de saque PIX',
    jsonb_build_object('feeAmount', v_fee, 'netAmount', v_net)
  );

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    p_user_id,
    'wallet_withdrawal_requested',
    'Saque solicitado',
    'Recebemos sua solicitação de saque de R$ ' || to_char(p_amount, 'FM999999990.00') || '.',
    jsonb_build_object('withdrawalId', v_withdrawal.id, 'amount', p_amount, 'netAmount', v_net)
  );

  RETURN jsonb_build_object(
    'success', true,
    'withdrawalId', v_withdrawal.id,
    'amount', p_amount,
    'feeAmount', v_fee,
    'netAmount', v_net,
    'status', v_withdrawal.status
  );
END;
$$;

-- 11) Complete/fail withdrawal and unlock balances
CREATE OR REPLACE FUNCTION public.finalize_wallet_withdrawal_atomic(
  p_withdrawal_id UUID,
  p_success BOOLEAN,
  p_asaas_transfer_id TEXT DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_w RECORD;
BEGIN
  SELECT * INTO v_w
  FROM public.wallet_withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF v_w IS NULL THEN
    RETURN jsonb_build_object('error', 'Saque não encontrado');
  END IF;

  IF v_w.status IN ('paid', 'failed', 'cancelled') THEN
    RETURN jsonb_build_object('success', true, 'idempotent', true, 'status', v_w.status);
  END IF;

  PERFORM public.ensure_user_wallet(v_w.user_id);

  IF p_success THEN
    UPDATE public.wallet_withdrawals
    SET status = 'paid',
        asaas_transfer_id = COALESCE(p_asaas_transfer_id, asaas_transfer_id),
        processed_at = now(),
        paid_at = now(),
        updated_at = now()
    WHERE id = v_w.id;

    UPDATE public.user_wallets
    SET locked_balance = GREATEST(0, locked_balance - v_w.amount),
        total_withdrawn = total_withdrawn + v_w.net_amount,
        updated_at = now()
    WHERE user_id = v_w.user_id;

    UPDATE public.wallet_ledger
    SET status = 'completed', updated_at = now()
    WHERE reference_type = 'withdrawal'
      AND reference_id = v_w.id
      AND wallet_tx_type = 'withdrawal_request';

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
      v_w.user_id,
      'withdrawal_fee',
      'debit',
      v_w.fee_amount,
      'completed',
      'locked',
      'withdrawal',
      v_w.id,
      'Taxa de processamento de saque',
      jsonb_build_object('netAmount', v_w.net_amount)
    );

    RETURN jsonb_build_object('success', true, 'status', 'paid', 'withdrawalId', v_w.id);
  END IF;

  UPDATE public.wallet_withdrawals
  SET status = 'failed',
      failure_reason = COALESCE(p_failure_reason, 'Transferência não concluída'),
      processed_at = now(),
      updated_at = now()
  WHERE id = v_w.id;

  UPDATE public.user_wallets
  SET locked_balance = GREATEST(0, locked_balance - v_w.amount),
      available_balance = available_balance + v_w.amount,
      updated_at = now()
  WHERE user_id = v_w.user_id;

  UPDATE public.wallet_ledger
  SET status = 'cancelled', updated_at = now()
  WHERE reference_type = 'withdrawal'
    AND reference_id = v_w.id
    AND wallet_tx_type = 'withdrawal_request';

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    v_w.user_id,
    'wallet_withdrawal_failed',
    'Saque não concluído',
    'Seu saque foi estornado para saldo disponível.',
    jsonb_build_object('withdrawalId', v_w.id, 'reason', p_failure_reason)
  );

  RETURN jsonb_build_object('success', true, 'status', 'failed', 'withdrawalId', v_w.id);
END;
$$;

-- 12) Cleanup helper for resale reservations expiration
CREATE OR REPLACE FUNCTION public.cleanup_expired_resale_orders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  WITH expired_orders AS (
    UPDATE public.resale_orders ro
    SET status = 'expired',
        cancelled_at = now(),
        failure_reason = COALESCE(ro.failure_reason, 'checkout_timeout'),
        updated_at = now()
    WHERE ro.status IN ('pending_payment', 'payment_processing')
      AND ro.expires_at IS NOT NULL
      AND ro.expires_at < now()
    RETURNING ro.id, ro.listing_id
  )
  UPDATE public.resale_listings rl
  SET status = 'active',
      reserved_by = NULL,
      reserved_until = NULL,
      updated_at = now()
  WHERE rl.id IN (SELECT listing_id FROM expired_orders)
    AND rl.status = 'reserved';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_user_wallet(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_resale_order_atomic(UUID, UUID, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_resale_order_atomic(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.reverse_resale_order_atomic(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_wallet_credits_due() TO service_role;
GRANT EXECUTE ON FUNCTION public.request_wallet_withdrawal_atomic(UUID, NUMERIC, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_wallet_withdrawal_atomic(UUID, BOOLEAN, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_resale_orders() TO service_role;
