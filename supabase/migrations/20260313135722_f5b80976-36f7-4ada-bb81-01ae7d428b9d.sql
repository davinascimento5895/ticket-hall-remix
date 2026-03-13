
-- Add staff link columns to events
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS staff_access_code text DEFAULT encode(gen_random_bytes(4), 'hex'),
  ADD COLUMN IF NOT EXISTS staff_link_max_uses integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS staff_link_uses integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS staff_link_expires_at timestamptz DEFAULT NULL;

-- Create function to join event as staff via access code
CREATE OR REPLACE FUNCTION public.join_event_as_staff(p_access_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_event RECORD;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Não autenticado');
  END IF;

  SELECT id, producer_id, title, staff_link_max_uses, staff_link_uses, staff_link_expires_at
  INTO v_event
  FROM events
  WHERE staff_access_code = p_access_code;

  IF v_event IS NULL THEN
    RETURN jsonb_build_object('error', 'Código inválido');
  END IF;

  IF v_event.staff_link_expires_at IS NOT NULL AND v_event.staff_link_expires_at < now() THEN
    RETURN jsonb_build_object('error', 'Este link expirou');
  END IF;

  IF v_event.staff_link_max_uses IS NOT NULL AND v_event.staff_link_uses >= v_event.staff_link_max_uses THEN
    RETURN jsonb_build_object('error', 'Limite de usos atingido');
  END IF;

  -- Check if already staff
  IF EXISTS (SELECT 1 FROM event_staff WHERE event_id = v_event.id AND user_id = v_user_id) THEN
    RETURN jsonb_build_object('success', true, 'event_id', v_event.id, 'event_title', v_event.title, 'already_member', true);
  END IF;

  -- Insert into event_staff
  INSERT INTO event_staff (event_id, user_id, producer_id)
  VALUES (v_event.id, v_user_id, v_event.producer_id);

  -- Ensure user has staff role
  INSERT INTO user_roles (user_id, role)
  VALUES (v_user_id, 'staff')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Increment uses
  UPDATE events SET staff_link_uses = COALESCE(staff_link_uses, 0) + 1 WHERE id = v_event.id;

  RETURN jsonb_build_object('success', true, 'event_id', v_event.id, 'event_title', v_event.title, 'already_member', false);
END;
$$;
