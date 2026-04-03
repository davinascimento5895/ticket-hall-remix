-- ============================================
-- MIGRATION: Correções de Segurança - Fase A
-- ============================================

-- 1. Desabilitar edge function purchase-resale insegura
-- Nota: A edge function será atualizada para retornar erro

-- 2. Garantir que resale_listings tenha constraint única no ticket_id
-- para prevenir race conditions na criação
DO $$
BEGIN
  -- Verificar se constraint existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_active_resale_per_ticket'
  ) THEN
    -- Primeiro, cancelar listagens duplicadas se houver
    WITH duplicates AS (
      SELECT ticket_id, id
      FROM (
        SELECT ticket_id, id, 
               ROW_NUMBER() OVER (PARTITION BY ticket_id ORDER BY created_at ASC) as rn
        FROM resale_listings
        WHERE status = 'active'
      ) t
      WHERE rn > 1
    )
    UPDATE resale_listings 
    SET status = 'cancelled', 
        updated_at = NOW()
    WHERE id IN (SELECT id FROM duplicates);
    
    -- Criar índice único parcial
    CREATE UNIQUE INDEX unique_active_resale_per_ticket 
    ON resale_listings(ticket_id) 
    WHERE status = 'active';
  END IF;
END $$;

-- 3. Garantir que tickets listados não possam ser transferidos
CREATE OR REPLACE FUNCTION prevent_transfer_during_resale()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_for_resale = true AND NEW.owner_id != OLD.owner_id THEN
    RAISE EXCEPTION 'Não é possível transferir ingresso que está em revenda. Cancele a revenda primeiro.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'prevent_transfer_during_resale'
  ) THEN
    CREATE TRIGGER prevent_transfer_during_resale
      BEFORE UPDATE ON tickets
      FOR EACH ROW
      EXECUTE FUNCTION prevent_transfer_during_resale();
  END IF;
END $$;

-- 4. Função para limpar listagens expiradas automaticamente
CREATE OR REPLACE FUNCTION cleanup_expired_resale_listings()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE resale_listings
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'active'
      AND expires_at < NOW()
    RETURNING id, ticket_id
  )
  UPDATE tickets t
  SET is_for_resale = false,
      resale_price = NULL,
      resale_listing_id = NULL
  FROM expired e
  WHERE t.id = e.ticket_id;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 5. Comentário sobre webhook
COMMENT ON FUNCTION cleanup_expired_resale_listings() IS 
'Deve ser chamada por um cron job diário para limpar listagens expiradas';

-- 6. Validar schema de wallet_transactions
DO $$
BEGIN
  -- Garantir que todas as transações tenham direction preenchido
  UPDATE wallet_transactions
  SET direction = CASE 
    WHEN tx_type IN ('resale_sale', 'bonus', 'adjustment') THEN 'credit'
    WHEN tx_type IN ('withdrawal', 'withdrawal_fee', 'chargeback') THEN 'debit'
    ELSE 'credit'
  END
  WHERE direction IS NULL;
END $$;

-- 7. Constraint para garantir que preço de revenda não exceda valor original
CREATE OR REPLACE FUNCTION validate_resale_price_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_original_price DECIMAL(10,2);
  v_max_price_percent DECIMAL(5,2);
  v_max_price DECIMAL(10,2);
BEGIN
  -- Buscar preço original do ticket tier
  SELECT tt.price INTO v_original_price
  FROM tickets t
  JOIN ticket_tiers tt ON t.tier_id = tt.id
  WHERE t.id = NEW.ticket_id;
  
  -- Buscar configuração do evento
  SELECT COALESCE(e.resale_max_price_percent, 100) INTO v_max_price_percent
  FROM resale_listings rl
  JOIN events e ON rl.event_id = e.id
  WHERE rl.id = NEW.id;
  
  -- Calcular preço máximo permitido (padrão: 100% = anti-cambismo)
  v_max_price := COALESCE(v_original_price, NEW.original_price) * (v_max_price_percent / 100);
  
  IF NEW.asking_price > v_max_price THEN
    RAISE EXCEPTION 'Preço de revenda (%) excede o limite permitido (%)', 
      NEW.asking_price, v_max_price;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'validate_resale_price'
  ) THEN
    CREATE TRIGGER validate_resale_price
      BEFORE INSERT OR UPDATE ON resale_listings
      FOR EACH ROW
      EXECUTE FUNCTION validate_resale_price_limits();
  END IF;
END $$;
