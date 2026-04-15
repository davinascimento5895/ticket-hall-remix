-- Fix the free-order flow so balance processing happens only after confirmation.

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

  -- Free orders stay pending until confirm_order_payment() runs after ticket reservation.
  INSERT INTO orders (
    buyer_id, event_id, subtotal, platform_fee, total,
    discount_amount, coupon_id, promoter_event_id,
    status, payment_status, payment_method, expires_at,
    billing_address
  ) VALUES (
    p_buyer_id, v_event_id, v_subtotal, v_platform_fee, v_total,
    v_discount, v_coupon_id, p_promoter_event_id,
    'pending',
    'pending',
    CASE WHEN v_is_free THEN 'free' ELSE NULL END,
    now() + interval '15 minutes',
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

CREATE OR REPLACE FUNCTION public.calculate_producer_balance(p_event_id UUID, p_producer_id UUID)
RETURNS JSONB AS $function$
DECLARE
  v_result JSONB;
  v_paid_order_count INTEGER;
  v_total_revenue DECIMAL(10,2);
  v_platform_fee DECIMAL(10,2);
  v_gateway_fee DECIMAL(10,2);
  v_available DECIMAL(10,2);
  v_locked DECIMAL(10,2);
BEGIN
  SELECT
    COUNT(*),
    COALESCE(SUM(o.total), 0),
    COALESCE(SUM(o.platform_fee), 0),
    COALESCE(SUM(o.payment_gateway_fee), 0)
  INTO v_paid_order_count, v_total_revenue, v_platform_fee, v_gateway_fee
  FROM public.orders o
  JOIN public.events e ON e.id = o.event_id
  WHERE o.event_id = p_event_id
    AND e.producer_id = p_producer_id
    AND o.status = 'paid'
    AND o.payment_status = 'paid';

  v_available := ROUND(v_total_revenue * 0.75, 2);
  v_locked := ROUND(v_total_revenue * 0.25, 2);

  RAISE NOTICE 'calculate_producer_balance: event_id=%, producer_id=%, paid_orders=%, total_revenue=%, platform_fee=%, gateway_fee=%, available_before_event=%, locked_after_event=%',
    p_event_id, p_producer_id, v_paid_order_count, v_total_revenue, v_platform_fee, v_gateway_fee, v_available, v_locked;

  v_result := jsonb_build_object(
    'event_id', p_event_id,
    'producer_id', p_producer_id,
    'paid_orders', v_paid_order_count,
    'total_revenue', v_total_revenue,
    'platform_fee', v_platform_fee,
    'gateway_fee', v_gateway_fee,
    'available_before_event', v_available,
    'locked_after_event', v_locked,
    'net_available', v_available,
    'net_locked', v_locked - v_platform_fee - v_gateway_fee
  );

  RETURN v_result;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public';

CREATE OR REPLACE FUNCTION public.update_producer_balance_after_sale()
RETURNS TRIGGER AS $function$
DECLARE
  v_calculated JSONB;
  v_producer_id UUID;
BEGIN
  SELECT e.producer_id INTO v_producer_id
  FROM public.events e
  WHERE e.id = NEW.event_id;

  IF v_producer_id IS NULL THEN
    RAISE NOTICE 'update_producer_balance_after_sale skipped: order_id=%, event_id=% could not resolve producer',
      NEW.id, NEW.event_id;
    RETURN NEW;
  END IF;

  IF NEW.status <> 'paid' OR NEW.payment_status <> 'paid' THEN
    RAISE NOTICE 'update_producer_balance_after_sale skipped unpaid order: order_id=%, tg_op=%, event_id=%, producer_id=%, status=%, payment_status=%',
      NEW.id, TG_OP, NEW.event_id, v_producer_id, NEW.status, NEW.payment_status;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'paid' AND OLD.payment_status = 'paid' THEN
    RAISE NOTICE 'update_producer_balance_after_sale skipped duplicate paid update: order_id=%, event_id=%, producer_id=%',
      NEW.id, NEW.event_id, v_producer_id;
    RETURN NEW;
  END IF;

  RAISE NOTICE 'update_producer_balance_after_sale processing: order_id=%, tg_op=%, event_id=%, producer_id=%, status=%, payment_status=%, total=%, platform_fee=%, payment_gateway_fee=%',
    NEW.id, TG_OP, NEW.event_id, v_producer_id, NEW.status, NEW.payment_status, NEW.total, NEW.platform_fee, NEW.payment_gateway_fee;

  v_calculated := calculate_producer_balance(NEW.event_id, v_producer_id);

  RAISE NOTICE 'update_producer_balance_after_sale calculated: order_id=%, event_id=%, producer_id=%, total_revenue=%, platform_fee=%, gateway_fee=%, available_before_event=%, locked_after_event=%',
    NEW.id, NEW.event_id, v_producer_id,
    (v_calculated->>'total_revenue')::DECIMAL,
    (v_calculated->>'platform_fee')::DECIMAL,
    (v_calculated->>'gateway_fee')::DECIMAL,
    (v_calculated->>'available_before_event')::DECIMAL,
    (v_calculated->>'locked_after_event')::DECIMAL;

  INSERT INTO public.producer_balances (
    producer_id, event_id,
    total_revenue, total_platform_fees, total_gateway_fees,
    available_before_event, locked_after_event
  )
  VALUES (
    v_producer_id, NEW.event_id,
    (v_calculated->>'total_revenue')::DECIMAL,
    (v_calculated->>'platform_fee')::DECIMAL,
    (v_calculated->>'gateway_fee')::DECIMAL,
    (v_calculated->>'available_before_event')::DECIMAL,
    (v_calculated->>'locked_after_event')::DECIMAL
  )
  ON CONFLICT (producer_id, event_id)
  DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_platform_fees = EXCLUDED.total_platform_fees,
    total_gateway_fees = EXCLUDED.total_gateway_fees,
    available_before_event = EXCLUDED.available_before_event,
    locked_after_event = EXCLUDED.locked_after_event,
    updated_at = now();

  INSERT INTO public.producer_balance_history (
    producer_id, event_id, movement_type, direction, amount,
    reference_type, reference_id, description,
    balance_available_after, balance_locked_after
  )
  VALUES (
    v_producer_id, NEW.event_id, 'sale', 'credit', NEW.total,
    'order', NEW.id, 'Venda de ingresso - Pedido ' || LEFT(NEW.id::TEXT, 8),
    (v_calculated->>'available_before_event')::DECIMAL,
    (v_calculated->>'locked_after_event')::DECIMAL
  );

  RETURN NEW;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public';

DROP TRIGGER IF EXISTS trigger_update_balance_on_order ON public.orders;
CREATE TRIGGER trigger_update_balance_on_order
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_producer_balance_after_sale();