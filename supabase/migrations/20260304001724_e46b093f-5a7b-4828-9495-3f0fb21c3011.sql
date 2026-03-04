
-- 1. Add unique constraint on lgpd_consents for upsert to work
ALTER TABLE public.lgpd_consents ADD CONSTRAINT lgpd_consents_user_consent_unique UNIQUE (user_id, consent_type);

-- 2. Create confirm_checkin_analytics function used by validate-checkin
CREATE OR REPLACE FUNCTION public.confirm_checkin_analytics(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE event_analytics
  SET tickets_checked_in = COALESCE(tickets_checked_in, 0) + 1,
      updated_at = NOW()
  WHERE event_id = p_event_id;
END;
$$;

-- 3. Fix virtual_queue position: only count waiting entries for new position
-- (no schema change needed, fix is in edge function code)
