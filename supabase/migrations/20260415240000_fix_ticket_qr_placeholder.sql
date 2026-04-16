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

  SELECT buyer_id INTO v_buyer_id FROM orders WHERE id = p_order_id;
  IF v_buyer_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE ticket_tiers
  SET quantity_reserved = COALESCE(quantity_reserved, 0) + p_quantity
  WHERE id = p_tier_id;

  INSERT INTO tickets (order_id, tier_id, event_id, owner_id, original_buyer_id, qr_code, status)
  SELECT
    p_order_id,
    p_tier_id,
    v_event_id,
    v_buyer_id,
    v_buyer_id,
    gen_random_uuid()::text,
    'reserved'
  FROM generate_series(1, p_quantity);

  RETURN TRUE;
END;
$$;