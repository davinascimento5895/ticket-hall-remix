
-- Create atomic RPC for listing creation
CREATE OR REPLACE FUNCTION public.create_resale_listing_atomic(
  p_ticket_id UUID,
  p_seller_id UUID,
  p_event_id UUID,
  p_tier_id UUID,
  p_asking_price NUMERIC,
  p_original_price NUMERIC,
  p_expires_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_ticket RECORD;
  v_platform_fee NUMERIC;
  v_seller_receives NUMERIC;
  v_listing_id UUID;
BEGIN
  SELECT * INTO v_ticket
  FROM tickets
  WHERE id = p_ticket_id AND status = 'active'
  FOR UPDATE;

  IF v_ticket IS NULL THEN
    RETURN jsonb_build_object('error', 'Ingresso não encontrado ou não está ativo');
  END IF;

  IF v_ticket.owner_id != p_seller_id THEN
    RETURN jsonb_build_object('error', 'Você não é o dono deste ingresso');
  END IF;

  IF v_ticket.is_for_resale = true THEN
    RETURN jsonb_build_object('error', 'Este ingresso já está em revenda');
  END IF;

  IF p_asking_price <= 0 OR p_asking_price > p_original_price THEN
    RETURN jsonb_build_object('error', 'Preço inválido. Deve ser entre R$ 0,01 e o valor original.');
  END IF;

  IF p_expires_at <= NOW() THEN
    RETURN jsonb_build_object('error', 'Data de expiração deve ser no futuro');
  END IF;

  IF EXISTS (SELECT 1 FROM events WHERE id = p_event_id AND start_date < NOW()) THEN
    RETURN jsonb_build_object('error', 'O evento já começou');
  END IF;

  v_platform_fee := ROUND(p_asking_price * 0.10, 2);
  v_seller_receives := ROUND(p_asking_price - v_platform_fee, 2);

  UPDATE tickets SET
    is_for_resale = true,
    resale_price = p_asking_price
  WHERE id = p_ticket_id;

  INSERT INTO resale_listings (
    ticket_id, seller_id, event_id, tier_id,
    original_price, asking_price, platform_fee_amount, seller_receives,
    expires_at, status
  ) VALUES (
    p_ticket_id, p_seller_id, p_event_id, p_tier_id,
    p_original_price, p_asking_price, v_platform_fee, v_seller_receives,
    p_expires_at, 'active'
  )
  RETURNING id INTO v_listing_id;

  RETURN jsonb_build_object(
    'success', true,
    'listingId', v_listing_id,
    'platformFee', v_platform_fee,
    'sellerReceives', v_seller_receives
  );
END;
$$;

-- Extend cleanup to also expire resale listings
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  WITH expired_orders AS (
    UPDATE orders
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending'
      AND expires_at IS NOT NULL
      AND expires_at < NOW()
    RETURNING id
  ),
  cancelled_tickets AS (
    UPDATE tickets
    SET status = 'cancelled'
    WHERE order_id IN (SELECT id FROM expired_orders)
      AND status = 'reserved'
    RETURNING tier_id
  )
  UPDATE ticket_tiers tt
  SET quantity_reserved = GREATEST(0, COALESCE(tt.quantity_reserved, 0) - sub.cnt)
  FROM (
    SELECT tier_id, COUNT(*) as cnt
    FROM cancelled_tickets
    GROUP BY tier_id
  ) sub
  WHERE tt.id = sub.tier_id;

  WITH expired_listings AS (
    UPDATE resale_listings
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active'
      AND (
        expires_at < NOW()
        OR EXISTS (SELECT 1 FROM events WHERE events.id = resale_listings.event_id AND events.start_date < NOW())
      )
    RETURNING ticket_id
  )
  UPDATE tickets
  SET is_for_resale = false, resale_price = NULL
  WHERE id IN (SELECT ticket_id FROM expired_listings)
    AND is_for_resale = true;
END;
$$;
