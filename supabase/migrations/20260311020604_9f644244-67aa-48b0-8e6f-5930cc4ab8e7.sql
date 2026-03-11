
-- Allow anyone (including anonymous) to SELECT producer_follows for public follower counts
CREATE POLICY "Anyone can view follows for counting"
ON public.producer_follows
FOR SELECT
TO public
USING (true);
