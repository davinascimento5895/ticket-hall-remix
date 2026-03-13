
-- Create rate_limits table for edge function rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  expires_at timestamp with time zone NOT NULL
);

-- No RLS needed - only accessed by service role in edge functions
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (no public policies needed)
