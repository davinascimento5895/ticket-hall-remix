
-- Fix permissive INSERT policy on checkin_scan_logs
DROP POLICY "Staff can insert scan logs" ON public.checkin_scan_logs;
CREATE POLICY "Authenticated users can insert scan logs" ON public.checkin_scan_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
