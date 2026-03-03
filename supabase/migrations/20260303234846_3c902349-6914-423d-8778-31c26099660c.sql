
-- ============================================
-- BLOCO 1.2: Atomic SQL functions
-- ============================================

-- 1. reserve_tickets: pessimistic lock on tier
CREATE OR REPLACE FUNCTION public.reserve_tickets(
  p_tier_id UUID,
  p_quantity INTEGER,
  p_order_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available INTEGER;
  v_event_id UUID;
  v_buyer_id UUID;
BEGIN
  -- Lock the tier row exclusively
  SELECT (quantity_total - quantity_sold - COALESCE(quantity_reserved, 0)), event_id
  INTO v_available, v_event_id
  FROM ticket_tiers
  WHERE id = p_tier_id
  FOR UPDATE;

  IF v_available IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_available < p_quantity THEN
    RETURN FALSE;
  END IF;

  -- Get buyer from order
  SELECT buyer_id INTO v_buyer_id FROM orders WHERE id = p_order_id;
  IF v_buyer_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Increment reservations
  UPDATE ticket_tiers
  SET quantity_reserved = COALESCE(quantity_reserved, 0) + p_quantity
  WHERE id = p_tier_id;

  -- Create reserved tickets
  INSERT INTO tickets (order_id, tier_id, event_id, owner_id, original_buyer_id, qr_code, status)
  SELECT
    p_order_id,
    p_tier_id,
    v_event_id,
    v_buyer_id,
    v_buyer_id,
    encode(gen_random_bytes(32), 'hex'),
    'reserved'
  FROM generate_series(1, p_quantity);

  RETURN TRUE;
END;
$$;

-- 2. confirm_order_payment: atomic confirmation
CREATE OR REPLACE FUNCTION public.confirm_order_payment(
  p_order_id UUID,
  p_asaas_payment TEXT,
  p_net_value NUMERIC
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_ticket RECORD;
BEGIN
  -- Get order (lock it)
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF v_order IS NULL OR v_order.status = 'paid' THEN
    RETURN FALSE; -- already paid or not found
  END IF;

  -- Update order to paid
  UPDATE orders SET
    status = 'paid',
    payment_status = 'paid',
    asaas_payment_id = p_asaas_payment,
    net_amount = p_net_value,
    platform_fee_amount = v_order.platform_fee,
    updated_at = NOW()
  WHERE id = p_order_id;

  -- Move tickets from reserved to active, update sold counts
  FOR v_ticket IN
    SELECT tier_id, COUNT(*) as cnt
    FROM tickets
    WHERE order_id = p_order_id AND status = 'reserved'
    GROUP BY tier_id
  LOOP
    UPDATE ticket_tiers SET
      quantity_sold = COALESCE(quantity_sold, 0) + v_ticket.cnt,
      quantity_reserved = GREATEST(0, COALESCE(quantity_reserved, 0) - v_ticket.cnt)
    WHERE id = v_ticket.tier_id;
  END LOOP;

  UPDATE tickets SET status = 'active' WHERE order_id = p_order_id AND status = 'reserved';

  -- Upsert event analytics
  INSERT INTO event_analytics (event_id, tickets_sold, total_revenue, platform_revenue, producer_revenue)
  VALUES (
    v_order.event_id,
    (SELECT COUNT(*) FROM tickets WHERE order_id = p_order_id AND status = 'active'),
    v_order.total,
    v_order.platform_fee,
    p_net_value - v_order.platform_fee
  )
  ON CONFLICT (event_id) DO UPDATE SET
    tickets_sold = event_analytics.tickets_sold + EXCLUDED.tickets_sold,
    total_revenue = event_analytics.total_revenue + EXCLUDED.total_revenue,
    platform_revenue = event_analytics.platform_revenue + EXCLUDED.platform_revenue,
    producer_revenue = event_analytics.producer_revenue + EXCLUDED.producer_revenue,
    updated_at = NOW();

  RETURN TRUE;
END;
$$;

-- 3. apply_coupon: atomic coupon application
CREATE OR REPLACE FUNCTION public.apply_coupon(
  p_coupon_id UUID,
  p_order_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ok BOOLEAN;
BEGIN
  UPDATE coupons
  SET uses_count = COALESCE(uses_count, 0) + 1
  WHERE id = p_coupon_id
    AND is_active = true
    AND (max_uses IS NULL OR COALESCE(uses_count, 0) < max_uses)
    AND (valid_until IS NULL OR valid_until > NOW())
    AND (valid_from IS NULL OR valid_from <= NOW())
  RETURNING true INTO v_ok;

  IF v_ok THEN
    UPDATE orders SET coupon_id = p_coupon_id WHERE id = p_order_id;
  END IF;

  RETURN COALESCE(v_ok, false);
END;
$$;

-- 4. cleanup_expired_reservations: cron-friendly
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Expire pending orders past their deadline
  WITH expired_orders AS (
    UPDATE orders
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending'
      AND expires_at IS NOT NULL
      AND expires_at < NOW()
    RETURNING id
  ),
  -- Cancel reserved tickets for those orders
  cancelled_tickets AS (
    UPDATE tickets
    SET status = 'cancelled'
    WHERE order_id IN (SELECT id FROM expired_orders)
      AND status = 'reserved'
    RETURNING tier_id
  )
  -- Decrement reserved counts
  UPDATE ticket_tiers tt
  SET quantity_reserved = GREATEST(0, COALESCE(tt.quantity_reserved, 0) - sub.cnt)
  FROM (
    SELECT tier_id, COUNT(*) as cnt
    FROM cancelled_tickets
    GROUP BY tier_id
  ) sub
  WHERE tt.id = sub.tier_id;
END;
$$;
