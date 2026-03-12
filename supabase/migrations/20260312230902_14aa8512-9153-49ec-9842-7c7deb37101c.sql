
CREATE OR REPLACE FUNCTION public.create_order_validated(
  p_tier_ids uuid[],
  p_quantities integer[],
  p_buyer_id uuid,
  p_coupon_code text DEFAULT NULL::text,
  p_promoter_event_id uuid DEFAULT NULL::uuid,
  p_billing_address text DEFAULT NULL::text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_event_id uuid;
  v_subtotal numeric(10,2) := 0;
  v_platform_fee_percent numeric;
  v_platform_fee numeric(10,2);
  v_discount numeric(10,2) := 0;
  v_total numeric(10,2);
  v_coupon_id uuid;
  v_coupon_discount_type text;
  v_coupon_discount_value numeric;
  v_coupon_applicable_tiers uuid[];
  v_order_id uuid;
  v_is_free boolean;
  v_tier_event_id uuid;
  v_tier_price numeric;
  v_applicable_subtotal numeric(10,2) := 0;
  i int;
BEGIN
  -- Validate arrays match
  IF array_length(p_tier_ids, 1) IS NULL OR array_length(p_tier_ids, 1) != array_length(p_quantities, 1) THEN
    RETURN jsonb_build_object('error', 'tier_ids and quantities must have equal length');
  END IF;

  -- Calculate subtotal from DB prices; verify all tiers belong to same event
  FOR i IN 1..array_length(p_tier_ids, 1) LOOP
    SELECT event_id, price INTO v_tier_event_id, v_tier_price
    FROM ticket_tiers WHERE id = p_tier_ids[i];

    IF v_tier_event_id IS NULL THEN
      RETURN jsonb_build_object('error', 'Tier not found: ' || p_tier_ids[i]::text);
    END IF;

    IF i = 1 THEN
      v_event_id := v_tier_event_id;
    ELSIF v_tier_event_id != v_event_id THEN
      RETURN jsonb_build_object('error', 'All tiers must belong to the same event');
    END IF;

    v_subtotal := v_subtotal + (v_tier_price * p_quantities[i]);
  END LOOP;

  -- Get platform fee percent from event
  SELECT COALESCE(platform_fee_percent, 7.0) INTO v_platform_fee_percent
  FROM events WHERE id = v_event_id;

  -- Apply coupon if provided
  IF p_coupon_code IS NOT NULL AND p_coupon_code != '' THEN
    SELECT id, discount_type, discount_value, applicable_tier_ids
    INTO v_coupon_id, v_coupon_discount_type, v_coupon_discount_value, v_coupon_applicable_tiers
    FROM coupons
    WHERE code = UPPER(TRIM(p_coupon_code))
      AND event_id = v_event_id
      AND is_active = true
      AND (max_uses IS NULL OR uses_count < max_uses)
      AND (valid_from IS NULL OR valid_from <= now())
      AND (valid_until IS NULL OR valid_until >= now());

    IF v_coupon_id IS NOT NULL THEN
      IF v_coupon_applicable_tiers IS NOT NULL AND array_length(v_coupon_applicable_tiers, 1) > 0 THEN
        FOR i IN 1..array_length(p_tier_ids, 1) LOOP
          IF p_tier_ids[i] = ANY(v_coupon_applicable_tiers) THEN
            SELECT price INTO v_tier_price FROM ticket_tiers WHERE id = p_tier_ids[i];
            v_applicable_subtotal := v_applicable_subtotal + (v_tier_price * p_quantities[i]);
          END IF;
        END LOOP;
      ELSE
        v_applicable_subtotal := v_subtotal;
      END IF;

      IF v_coupon_discount_type = 'percentage' THEN
        v_discount := LEAST(v_applicable_subtotal, ROUND(v_applicable_subtotal * v_coupon_discount_value / 100, 2));
      ELSE
        v_discount := LEAST(v_applicable_subtotal, v_coupon_discount_value);
      END IF;
    END IF;
  END IF;

  -- Calculate platform fee (zero if fully discounted)
  IF v_discount >= v_subtotal THEN
    v_platform_fee := 0;
  ELSE
    v_platform_fee := ROUND(v_subtotal * v_platform_fee_percent / 100, 2);
  END IF;

  v_total := GREATEST(0, v_subtotal + v_platform_fee - v_discount);
  v_is_free := (v_total = 0);

  -- Create order (now includes billing_address)
  INSERT INTO orders (
    buyer_id, event_id, subtotal, platform_fee, total,
    discount_amount, coupon_id, promoter_event_id,
    status, payment_status, payment_method, expires_at,
    billing_address
  ) VALUES (
    p_buyer_id, v_event_id, v_subtotal, v_platform_fee, v_total,
    v_discount, v_coupon_id, p_promoter_event_id,
    CASE WHEN v_is_free THEN 'paid' ELSE 'pending' END,
    CASE WHEN v_is_free THEN 'paid' ELSE 'pending' END,
    CASE WHEN v_is_free THEN 'free' ELSE NULL END,
    CASE WHEN v_is_free THEN NULL ELSE (now() + interval '15 minutes') END,
    p_billing_address
  ) RETURNING id INTO v_order_id;

  -- Apply coupon usage if used
  IF v_coupon_id IS NOT NULL AND v_discount > 0 THEN
    UPDATE coupons SET uses_count = uses_count + 1 WHERE id = v_coupon_id;
    UPDATE orders SET coupon_id = v_coupon_id WHERE id = v_order_id;
  END IF;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'event_id', v_event_id,
    'subtotal', v_subtotal,
    'platform_fee', v_platform_fee,
    'discount', v_discount,
    'total', v_total,
    'is_free', v_is_free,
    'coupon_id', v_coupon_id
  );
END;
$function$;
