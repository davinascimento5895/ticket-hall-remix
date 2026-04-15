
-- 1. Add 'staff' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';

-- 2. Create event_staff table
CREATE TABLE public.event_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  producer_id uuid NOT NULL,
  checkin_list_id uuid REFERENCES public.checkin_lists(id),
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_staff ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_staff
CREATE POLICY "Staff can view their assignments"
  ON public.event_staff FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Producers can manage staff for their events"
  ON public.event_staff FOR ALL
  TO authenticated
  USING (auth.uid() = producer_id)
  WITH CHECK (auth.uid() = producer_id);

CREATE POLICY "Admins can manage all event staff"
  ON public.event_staff FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Enable realtime on tickets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tickets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
  END IF;
END $$;

-- 4. Add RLS for staff to view tickets of their assigned events
CREATE POLICY "Staff can view tickets for their events"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.event_staff es
      WHERE es.event_id = tickets.event_id
      AND es.user_id = auth.uid()
    )
  );

-- 5. Add RLS for staff to view events they are assigned to
CREATE POLICY "Staff can view their assigned events"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.event_staff es
      WHERE es.event_id = events.id
      AND es.user_id = auth.uid()
    )
  );

-- 6. Staff can view event_analytics for their events
CREATE POLICY "Staff can view analytics for their events"
  ON public.event_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.event_staff es
      WHERE es.event_id = event_analytics.event_id
      AND es.user_id = auth.uid()
    )
  );

-- 7. Staff can view checkin_lists for their events
CREATE POLICY "Staff can view checkin lists for their events"
  ON public.checkin_lists FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.event_staff es
      WHERE es.event_id = checkin_lists.event_id
      AND es.user_id = auth.uid()
    )
  );
