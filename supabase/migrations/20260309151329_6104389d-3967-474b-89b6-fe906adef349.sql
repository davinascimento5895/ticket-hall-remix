CREATE POLICY "Buyers can update their pending orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = buyer_id AND status = 'pending')
WITH CHECK (auth.uid() = buyer_id);