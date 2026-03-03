
-- Rate limits: only service role can access (used by edge functions)
CREATE POLICY "Service role only" ON public.rate_limits
  FOR ALL TO service_role USING (true) WITH CHECK (true);
