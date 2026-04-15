-- Migration: Configurações de Revenda para Eventos e Ingressos
-- Created: 2026-04-02

-- ============================================
-- 1. CONFIGURAÇÕES DE REVENDA NO EVENTO
-- ============================================

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS allow_resale BOOLEAN DEFAULT true;

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS resale_min_price_percent DECIMAL(5,2) DEFAULT 50.00;

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS resale_max_price_percent DECIMAL(5,2) DEFAULT 150.00;

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS resale_start_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS resale_end_date TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 2. CONFIGURAÇÃO DE REVENDA POR INGRESSO (TICKET TIER)
-- ============================================

ALTER TABLE public.ticket_tiers 
ADD COLUMN IF NOT EXISTS is_resellable BOOLEAN DEFAULT true;

-- ============================================
-- 3. TABELA DE ANÚNCIOS DE REVENDA
-- ============================================

CREATE TABLE IF NOT EXISTS public.resale_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_price DECIMAL(10,2) NOT NULL,
  asking_price DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  seller_receives DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sold_at TIMESTAMP WITH TIME ZONE,
  buyer_id UUID REFERENCES auth.users(id)
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_resale_listings_event ON public.resale_listings(event_id);
CREATE INDEX IF NOT EXISTS idx_resale_listings_seller ON public.resale_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_resale_listings_buyer ON public.resale_listings(buyer_id);
CREATE INDEX IF NOT EXISTS idx_resale_listings_status ON public.resale_listings(status);
CREATE INDEX IF NOT EXISTS idx_resale_listings_ticket ON public.resale_listings(ticket_id);
CREATE INDEX IF NOT EXISTS idx_resale_listings_created_at ON public.resale_listings(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_resale_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_resale_listings ON public.resale_listings;
CREATE TRIGGER trigger_update_resale_listings
  BEFORE UPDATE ON public.resale_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_resale_listings_updated_at();

-- ============================================
-- 4. TABELA DE CARTEIRA DIGITAL
-- ============================================

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  available_balance DECIMAL(10,2) DEFAULT 0,
  pending_balance DECIMAL(10,2) DEFAULT 0,
  locked_balance DECIMAL(10,2) DEFAULT 0,
  total_earned DECIMAL(10,2) DEFAULT 0,
  total_withdrawn DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);

-- ============================================
-- 5. TABELA DE TRANSAÇÕES DA CARTEIRA
-- ============================================

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de transação
  tx_type TEXT NOT NULL CHECK (tx_type IN (
    'resale_sale',      -- venda de ingresso revendido
    'resale_refund',    -- estorno de venda
    'withdrawal',       -- saque
    'withdrawal_fee',   -- taxa de saque
    'adjustment',       -- ajuste manual
    'bonus',            -- bônus
    'chargeback'        -- chargeback
  )),
  
  -- Direção: credit (entrada) ou debit (saída)
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  
  -- Valores
  amount DECIMAL(10,2) NOT NULL,
  
  -- Referência
  reference_type TEXT,  -- 'resale_listing', 'withdrawal', etc
  reference_id UUID,    -- ID da referência
  
  -- Descrição
  description TEXT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN (
    'pending',      -- aguardando
    'completed',    -- completo
    'failed',       -- falhou
    'reversed'      -- estornado
  )),
  
  -- Metadados
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Saldo após a transação (para auditoria)
  balance_after DECIMAL(10,2)
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type ON public.wallet_transactions(tx_type);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_reference ON public.wallet_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON public.wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_status ON public.wallet_transactions(status);

-- ============================================
-- 6. TABELA DE SAQUES DA CARTEIRA
-- ============================================

CREATE TABLE IF NOT EXISTS public.wallet_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Valores
  amount DECIMAL(10,2) NOT NULL,
  fee_amount DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  
  -- Dados PIX
  pix_key TEXT NOT NULL,
  pix_key_type TEXT NOT NULL CHECK (pix_key_type IN ('cpf', 'email', 'phone', 'random')),
  
  -- Status
  status TEXT DEFAULT 'requested' CHECK (status IN (
    'requested',     -- solicitado
    'under_review',  -- em revisão
    'processing',    -- processando
    'paid',          -- pago
    'failed',        -- falhou
    'cancelled'      -- cancelado
  )),
  
  -- Prazos e processamento
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expected_payment_date DATE,  -- D+2 úteis
  processed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Processado por (admin)
  processed_by UUID REFERENCES auth.users(id),
  
  -- Comprovante
  receipt_url TEXT,
  
  -- Falha
  failure_reason TEXT,
  
  -- Observações internas
  admin_notes TEXT,
  
  -- Referência à transação da carteira
  wallet_transaction_id UUID REFERENCES public.wallet_transactions(id)
);

CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_user ON public.wallet_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_status ON public.wallet_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_requested ON public.wallet_withdrawals(requested_at DESC);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wallet_withdrawals'
      AND column_name = 'processed_by'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_processed ON public.wallet_withdrawals(processed_by);
  END IF;
END $$;

-- ============================================
-- 7. POLÍTICAS DE SEGURANÇA (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE public.resale_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_withdrawals ENABLE ROW LEVEL SECURITY;

-- Resale listings policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resale_listings'
      AND policyname = 'Users can view active resale listings'
  ) THEN
    CREATE POLICY "Users can view active resale listings"
      ON public.resale_listings FOR SELECT
      TO authenticated
      USING (status = 'active' OR seller_id = auth.uid() OR buyer_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resale_listings'
      AND policyname = 'Users can create resale listings for their tickets'
  ) THEN
    CREATE POLICY "Users can create resale listings for their tickets"
      ON public.resale_listings FOR INSERT
      TO authenticated
      WITH CHECK (seller_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resale_listings'
      AND policyname = 'Sellers can update their own listings'
  ) THEN
    CREATE POLICY "Sellers can update their own listings"
      ON public.resale_listings FOR UPDATE
      TO authenticated
      USING (seller_id = auth.uid())
      WITH CHECK (seller_id = auth.uid());
  END IF;
END $$;

-- Wallet policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wallets'
      AND policyname = 'Users can view own wallet'
  ) THEN
    CREATE POLICY "Users can view own wallet"
      ON public.wallets FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Wallet transactions policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wallet_transactions'
      AND policyname = 'Users can view own transactions'
  ) THEN
    CREATE POLICY "Users can view own transactions"
      ON public.wallet_transactions FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Wallet withdrawals policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wallet_withdrawals'
      AND policyname = 'Users can view own withdrawals'
  ) THEN
    CREATE POLICY "Users can view own withdrawals"
      ON public.wallet_withdrawals FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wallet_withdrawals'
      AND policyname = 'Users can create withdrawal requests'
  ) THEN
    CREATE POLICY "Users can create withdrawal requests"
      ON public.wallet_withdrawals FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ============================================
-- 8. FUNÇÕES AUXILIARES
-- ============================================

-- Função para obter ou criar carteira do usuário
CREATE OR REPLACE FUNCTION get_or_create_wallet(p_user_id UUID)
RETURNS public.wallets AS $$
DECLARE
  v_wallet public.wallets;
BEGIN
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_wallet;
  END IF;
  
  RETURN v_wallet;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular taxa de saque (1%, mínimo R$ 1,00)
CREATE OR REPLACE FUNCTION calculate_withdrawal_fee(p_amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN GREATEST(1.00, ROUND(p_amount * 0.01, 2));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 9. COMENTÁRIOS DOCUMENTANDO AS TABELAS
-- ============================================

COMMENT ON TABLE public.resale_listings IS 'Anúncios de revenda de ingressos no marketplace interno';
COMMENT ON TABLE public.wallets IS 'Carteiras digitais dos usuários para receber de revendas';
COMMENT ON TABLE public.wallet_transactions IS 'Histórico de transações das carteiras';
COMMENT ON TABLE public.wallet_withdrawals IS 'Solicitações de saque da carteira digital';

COMMENT ON COLUMN public.events.allow_resale IS 'Se o produtor permite revenda para este evento';
COMMENT ON COLUMN public.events.resale_min_price_percent IS 'Percentual mínimo do preço original para revenda';
COMMENT ON COLUMN public.events.resale_max_price_percent IS 'Percentual máximo do preço original para revenda';
COMMENT ON COLUMN public.ticket_tiers.is_resellable IS 'Se este tipo de ingresso específico pode ser revendido';
