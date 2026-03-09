
-- Add promoter_event_id to orders for tracking which promoter generated the sale
ALTER TABLE public.orders ADD COLUMN promoter_event_id uuid REFERENCES public.promoter_events(id) ON DELETE SET NULL;

-- Create trigger function to auto-generate promoter commissions when order is paid
CREATE OR REPLACE FUNCTION public.handle_promoter_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pe RECORD;
  v_commission numeric;
BEGIN
  -- Only process when status changes to 'paid' and has a promoter_event_id
  IF NEW.status = 'paid' AND NEW.promoter_event_id IS NOT NULL
     AND (OLD.status IS DISTINCT FROM 'paid') THEN

    -- Get the promoter_event record
    SELECT * INTO v_pe FROM promoter_events WHERE id = NEW.promoter_event_id;
    IF v_pe IS NULL THEN
      RETURN NEW;
    END IF;

    -- Calculate commission
    IF v_pe.commission_type = 'percentage' THEN
      v_commission := NEW.subtotal * v_pe.commission_value / 100;
    ELSE
      v_commission := v_pe.commission_value;
    END IF;

    -- Insert commission record (avoid duplicates)
    INSERT INTO promoter_commissions (
      promoter_id, promoter_event_id, order_id, event_id, producer_id,
      order_amount, commission_amount, status
    ) VALUES (
      v_pe.promoter_id, v_pe.id, NEW.id, NEW.event_id, v_pe.producer_id,
      NEW.subtotal, v_commission, 'pending'
    ) ON CONFLICT DO NOTHING;

    -- Update promoter_events stats
    UPDATE promoter_events SET
      revenue_generated = COALESCE(revenue_generated, 0) + NEW.subtotal,
      conversions = COALESCE(conversions, 0) + 1,
      commission_total = COALESCE(commission_total, 0) + v_commission
    WHERE id = NEW.promoter_event_id;

    -- Update promoter totals
    UPDATE promoters SET
      total_sales = COALESCE(total_sales, 0) + NEW.subtotal,
      total_commission_earned = COALESCE(total_commission_earned, 0) + v_commission
    WHERE id = v_pe.promoter_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER trg_promoter_commission
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_promoter_commission();
