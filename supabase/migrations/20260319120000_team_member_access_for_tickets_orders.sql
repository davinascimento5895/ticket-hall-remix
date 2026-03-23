-- This migration extends producer access policies to include active team members.
--
-- Without this, team members (even with UI permissions) may see empty lists for tickets/orders
-- because Supabase row-level security only allows the producer's user id.

-- -----------------------------------------------------------------------------
-- Tickets
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Producers can view tickets for their events" ON public.tickets;

CREATE POLICY "Producers and team members can view tickets for their events" ON public.tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_id
        AND (
          e.producer_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.producer_team_members m
            WHERE m.producer_id = e.producer_id
              AND m.user_id = auth.uid()
              AND m.status = 'active'
          )
        )
    )
  );

-- -----------------------------------------------------------------------------
-- Orders
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Producers can view orders for their events" ON public.orders;

CREATE POLICY "Producers and team members can view orders for their events" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_id
        AND (
          e.producer_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.producer_team_members m
            WHERE m.producer_id = e.producer_id
              AND m.user_id = auth.uid()
              AND m.status = 'active'
          )
        )
    )
  );

-- -----------------------------------------------------------------------------
-- Events (read-only access should also include team members)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Producers can view their own events" ON public.events;

CREATE POLICY "Producers and team members can view events" ON public.events
  FOR SELECT USING (
    producer_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.producer_team_members m
      WHERE m.producer_id = producer_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );
