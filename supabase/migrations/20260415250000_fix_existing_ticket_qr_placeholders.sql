-- Fix any existing tickets that still have the old 64-character hex placeholder qr_code.
-- This ensures both paid and free tickets created before the reserve_tickets fix
-- become scannable using their ticket UUID.
UPDATE public.tickets
SET
  qr_code = id::text,
  qr_code_image_url = NULL
WHERE qr_code ~ '^[0-9a-fA-F]{64}$';
