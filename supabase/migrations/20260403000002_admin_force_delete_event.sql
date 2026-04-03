CREATE OR REPLACE FUNCTION public.admin_force_delete_event(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado para remover evento' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.checkin_scan_logs
  WHERE ticket_id IN (
    SELECT id FROM public.tickets WHERE event_id = p_event_id
  )
  OR checkin_list_id IN (
    SELECT id FROM public.checkin_lists WHERE event_id = p_event_id
  );

  DELETE FROM public.resale_listings
  WHERE event_id = p_event_id
  OR ticket_id IN (
    SELECT id FROM public.tickets WHERE event_id = p_event_id
  );

  DELETE FROM public.webhooks
  WHERE event_id = p_event_id;

  DELETE FROM public.producer_messages
  WHERE event_id = p_event_id;

  DELETE FROM public.event_analytics
  WHERE event_id = p_event_id;

  DELETE FROM public.checkin_sessions
  WHERE event_id = p_event_id;

  DELETE FROM public.waitlist
  WHERE event_id = p_event_id;

  DELETE FROM public.orders
  WHERE event_id = p_event_id;

  DELETE FROM public.events
  WHERE id = p_event_id;
END;
$$;