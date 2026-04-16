-- Repair any tickets created between 20260415240000 and now
-- where qr_code is a random UUID instead of the ticket's own id.
-- This fixes the 404 "Ingresso não encontrado" on scan.

UPDATE public.tickets
SET qr_code = id::text,
    qr_code_image_url = NULL
WHERE qr_code ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND qr_code <> id::text;
