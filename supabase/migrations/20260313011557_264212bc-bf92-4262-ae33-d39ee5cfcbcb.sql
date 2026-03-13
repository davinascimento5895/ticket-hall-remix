-- Fix tickets status constraint to allow 'reserved' and 'suspended'
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_status_check 
  CHECK (status = ANY (ARRAY['active','used','cancelled','transferred','refunded','reserved','suspended']));
