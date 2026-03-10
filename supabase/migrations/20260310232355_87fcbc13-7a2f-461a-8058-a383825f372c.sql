-- M03: Atomic increment for event views
CREATE OR REPLACE FUNCTION public.increment_event_views(p_event_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE events SET views_count = COALESCE(views_count, 0) + 1 WHERE id = p_event_id;
$$;

-- M03: Atomic increment for promoter clicks
CREATE OR REPLACE FUNCTION public.increment_promoter_clicks(p_promoter_event_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE promoter_events SET clicks = COALESCE(clicks, 0) + 1 WHERE id = p_promoter_event_id;
$$;

-- A08: Validate unlock code server-side without exposing codes
CREATE OR REPLACE FUNCTION public.validate_unlock_code(p_event_id uuid, p_code text)
RETURNS uuid[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tier_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO v_tier_ids
  FROM ticket_tiers
  WHERE event_id = p_event_id
    AND is_hidden_by_default = true
    AND is_visible = true
    AND unlock_code = p_code;
  
  RETURN COALESCE(v_tier_ids, ARRAY[]::uuid[]);
END;
$$;