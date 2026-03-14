-- ============================================================
-- Team member role enforcement
-- ============================================================
-- Problem: producer_team_members.role is stored but never checked.
-- Fix: Create a helper function and add RLS policies that respect roles.

-- Helper: returns the team member role for a user within a producer's org.
-- Returns NULL if the user is not a team member.
CREATE OR REPLACE FUNCTION public.get_team_member_role(p_producer_id uuid, p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM producer_team_members
  WHERE producer_id = p_producer_id
    AND user_id = p_user_id
    AND status = 'active'
  LIMIT 1;
$$;

-- Helper: check if user can access financial data for a producer.
-- Only producer owner, team admin, and team manager can access financial data.
CREATE OR REPLACE FUNCTION public.can_access_financial(p_producer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    auth.uid() = p_producer_id
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM producer_team_members
      WHERE producer_id = p_producer_id
        AND user_id = auth.uid()
        AND status = 'active'
        AND role IN ('admin')
    );
$$;

-- RLS on accounts_payable: only producer owner and team admin
-- (accounts_payable has producer_id column)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts_payable') THEN
    EXECUTE 'CREATE POLICY "Team members with financial access can view AP" ON public.accounts_payable FOR SELECT TO authenticated USING (can_access_financial(producer_id))';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts_receivable') THEN
    EXECUTE 'CREATE POLICY "Team members with financial access can view AR" ON public.accounts_receivable FOR SELECT TO authenticated USING (can_access_financial(producer_id))';
  END IF;
END $$;
