-- 1. Create atomic purchase function to prevent race conditions
CREATE OR REPLACE FUNCTION public.purchase_resale_atomic(
  p_listing_id UUID,
  p_buyer_id UUID,
  p_buyer_email TEXT,
  p_new_qr_code TEXT,
  p_new_qr_image_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_listing RECORD;
  v_ticket RECORD;
  v_platform_fee NUMERIC;
  v_seller_receives NUMERIC;
  v_existing_history JSONB;
  v_transfer_entry JSONB;
BEGIN
  -- Lock the listing row exclusively
  SELECT * INTO v_listing
  FROM resale_listings
  WHERE id = p_listing_id AND status = 'active'
  FOR UPDATE;

  IF v_listing IS NULL THEN
    RETURN jsonb_build_object('error', 'Anúncio não encontrado ou já vendido');
  END IF;

  IF v_listing.seller_id = p_buyer_id THEN
    RETURN jsonb_build_object('error', 'Você não pode comprar seu próprio ingresso');
  END IF;

  IF v_listing.expires_at < NOW() THEN
    UPDATE resale_listings SET status = 'expired', updated_at = NOW() WHERE id = p_listing_id;
    UPDATE tickets SET is_for_resale = false WHERE id = v_listing.ticket_id;
    RETURN jsonb_build_object('error', 'Este anúncio expirou');
  END IF;

  IF EXISTS (SELECT 1 FROM events WHERE id = v_listing.event_id AND start_date < NOW()) THEN
    UPDATE resale_listings SET status = 'expired', updated_at = NOW() WHERE id = p_listing_id;
    UPDATE tickets SET is_for_resale = false WHERE id = v_listing.ticket_id;
    RETURN jsonb_build_object('error', 'O evento já começou');
  END IF;

  v_platform_fee := ROUND(v_listing.asking_price * 0.10, 2);
  v_seller_receives := ROUND(v_listing.asking_price - v_platform_fee, 2);

  SELECT * INTO v_ticket
  FROM tickets
  WHERE id = v_listing.ticket_id AND status = 'active'
  FOR UPDATE;

  IF v_ticket IS NULL THEN
    RETURN jsonb_build_object('error', 'Ingresso não está mais disponível');
  END IF;

  v_existing_history := COALESCE(v_ticket.transfer_history::jsonb, '[]'::jsonb);
  v_transfer_entry := jsonb_build_object(
    'type', 'resale',
    'from', v_listing.seller_id,
    'to', p_buyer_id,
    'at', NOW(),
    'price', v_listing.asking_price,
    'platformFee', v_platform_fee
  );

  UPDATE tickets SET
    owner_id = p_buyer_id,
    qr_code = p_new_qr_code,
    qr_code_image_url = p_new_qr_image_url,
    transfer_history = v_existing_history || v_transfer_entry,
    attendee_name = NULL,
    attendee_email = p_buyer_email,
    attendee_cpf = NULL,
    is_for_resale = false,
    resale_price = NULL
  WHERE id = v_ticket.id;

  UPDATE resale_listings SET
    status = 'sold',
    buyer_id = p_buyer_id,
    sold_at = NOW(),
    platform_fee_amount = v_platform_fee,
    seller_receives = v_seller_receives,
    updated_at = NOW()
  WHERE id = p_listing_id;

  INSERT INTO notifications (user_id, type, title, body, data) VALUES
    (v_listing.seller_id, 'resale_sold', 'Ingresso vendido!',
     'Seu ingresso foi vendido por R$ ' || v_listing.asking_price || '. Você receberá R$ ' || v_seller_receives || ' (taxa de 10%).',
     jsonb_build_object('listingId', p_listing_id, 'ticketId', v_ticket.id, 'amount', v_seller_receives)),
    (p_buyer_id, 'resale_purchased', 'Ingresso adquirido!',
     'Você comprou um ingresso por R$ ' || v_listing.asking_price || '. Acesse em "Meus Ingressos".',
     jsonb_build_object('listingId', p_listing_id, 'ticketId', v_ticket.id));

  RETURN jsonb_build_object(
    'success', true,
    'ticketId', v_ticket.id,
    'total', v_listing.asking_price,
    'platformFee', v_platform_fee,
    'sellerReceives', v_seller_receives
  );
END;
$$;

-- 2. Add unique partial index to prevent duplicate active listings
CREATE UNIQUE INDEX IF NOT EXISTS idx_resale_listings_active_ticket
ON resale_listings (ticket_id) WHERE status = 'active';

-- 3. Add original_price column for backend anti-scalping validation
ALTER TABLE resale_listings ADD COLUMN IF NOT EXISTS original_price NUMERIC;