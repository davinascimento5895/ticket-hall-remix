-- Migration: Sistema de Saque do Produtor (Modelo 75/25)
-- Created: 2026-04-02

-- ============================================
-- 1. TABELA DE SALDOS DO PRODUTOR POR EVENTO
-- ============================================

CREATE TABLE IF NOT EXISTS public.producer_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- Saldos por categoria (modelo 75/25)
  available_before_event DECIMAL(10,2) DEFAULT 0, -- 75% liberado antes
  locked_after_event DECIMAL(10,2) DEFAULT 0,     -- 25% liberado após
  pending_withdrawal DECIMAL(10,2) DEFAULT 0,     -- em solicitação
  total_withdrawn DECIMAL(10,2) DEFAULT 0,        -- total já sacado
  
  -- Receita bruta
  total_revenue DECIMAL(10,2) DEFAULT 0,
  
  -- Taxas e descontos
  total_platform_fees DECIMAL(10,2) DEFAULT 0,    -- taxa TicketHall (7%)
  total_gateway_fees DECIMAL(10,2) DEFAULT 0,     -- taxas de gateway
  total_chargebacks DECIMAL(10,2) DEFAULT 0,      -- chargebacks
  other_deductions DECIMAL(10,2) DEFAULT 0,       -- outros descontos
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraint único: um saldo por produtor/evento
  UNIQUE(producer_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_producer_balances_producer ON public.producer_balances(producer_id);
CREATE INDEX IF NOT EXISTS idx_producer_balances_event ON public.producer_balances(event_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_producer_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_producer_balances ON public.producer_balances;
CREATE TRIGGER trigger_update_producer_balances
  BEFORE UPDATE ON public.producer_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_producer_balances_updated_at();

-- ============================================
-- 2. TABELA DE SAQUES DO PRODUTOR
-- ============================================

CREATE TABLE IF NOT EXISTS public.producer_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL, -- pode ser NULL para saque geral
  
  -- Valor
  amount DECIMAL(10,2) NOT NULL,
  withdrawal_type TEXT NOT NULL CHECK (withdrawal_type IN ('before_event', 'after_event')),
  
  -- Dados bancários (snapshot no momento da solicitação)
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  bank_name TEXT,
  account_name TEXT,
  agency TEXT,
  account_number TEXT,
  pix_key TEXT,
  pix_key_type TEXT CHECK (pix_key_type IN ('cpf', 'email', 'phone', 'random')),
  
  -- Status
  status TEXT DEFAULT 'requested' CHECK (status IN (
    'requested',     -- solicitado pelo produtor
    'under_review',  -- em revisão
    'processing',    -- processando
    'paid',          -- pago
    'rejected'       -- rejeitado
  )),
  
  -- Prazos
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expected_payment_date DATE,  -- D+2 úteis calculado
  processed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Processado por (admin)
  processed_by UUID REFERENCES auth.users(id),
  
  -- Comprovante
  receipt_url TEXT,
  
  -- Rejeição
  rejection_reason TEXT,
  
  -- Observações
  admin_notes TEXT,
  producer_notes TEXT,
  
  -- Referências
  balance_snapshot JSONB  -- snapshot do saldo no momento da solicitação
);

CREATE INDEX IF NOT EXISTS idx_producer_withdrawals_producer ON public.producer_withdrawals(producer_id);
CREATE INDEX IF NOT EXISTS idx_producer_withdrawals_event ON public.producer_withdrawals(event_id);
CREATE INDEX IF NOT EXISTS idx_producer_withdrawals_status ON public.producer_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_producer_withdrawals_requested ON public.producer_withdrawals(requested_at DESC);

-- ============================================
-- 3. TABELA DE HISTÓRICO DE MOVIMENTAÇÕES
-- ============================================

CREATE TABLE IF NOT EXISTS public.producer_balance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- Tipo de movimentação
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'sale',           -- venda de ingresso
    'fee_platform',   -- taxa TicketHall
    'fee_gateway',    -- taxa gateway
    'chargeback',     -- chargeback
    'withdrawal',     -- saque
    'adjustment',     -- ajuste manual
    'release_after_event'  -- liberação do 25%
  )),
  
  -- Direção
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  
  -- Valor
  amount DECIMAL(10,2) NOT NULL,
  
  -- Referência
  reference_type TEXT,  -- 'order', 'ticket', 'withdrawal', etc
  reference_id UUID,
  
  -- Descrição
  description TEXT NOT NULL,
  
  -- Saldo após movimentação
  balance_available_after DECIMAL(10,2),
  balance_locked_after DECIMAL(10,2),
  
  -- Metadados
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_producer_balance_history_producer ON public.producer_balance_history(producer_id);
CREATE INDEX IF NOT EXISTS idx_producer_balance_history_event ON public.producer_balance_history(event_id);
CREATE INDEX IF NOT EXISTS idx_producer_balance_history_type ON public.producer_balance_history(movement_type);
CREATE INDEX IF NOT EXISTS idx_producer_balance_history_created ON public.producer_balance_history(created_at DESC);

-- ============================================
-- 4. FUNÇÃO PARA CALCULAR SALDO DO PRODUTOR
-- ============================================

CREATE OR REPLACE FUNCTION calculate_producer_balance(p_event_id UUID, p_producer_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_total_revenue DECIMAL(10,2);
  v_platform_fee DECIMAL(10,2);
  v_gateway_fee DECIMAL(10,2);
  v_available DECIMAL(10,2);
  v_locked DECIMAL(10,2);
BEGIN
  -- Calcular receita total dos pedidos pagos
  SELECT 
    COALESCE(SUM(total), 0),
    COALESCE(SUM(platform_fee), 0),
    COALESCE(SUM(payment_gateway_fee), 0)
  INTO v_total_revenue, v_platform_fee, v_gateway_fee
  FROM public.orders
  WHERE event_id = p_event_id
    AND producer_id = p_producer_id
    AND status = 'paid'
    AND payment_status = 'paid';
  
  -- Calcular saldos 75/25
  v_available := ROUND(v_total_revenue * 0.75, 2);
  v_locked := ROUND(v_total_revenue * 0.25, 2);
  
  -- Montar resultado
  v_result := jsonb_build_object(
    'event_id', p_event_id,
    'producer_id', p_producer_id,
    'total_revenue', v_total_revenue,
    'platform_fee', v_platform_fee,
    'gateway_fee', v_gateway_fee,
    'available_before_event', v_available,
    'locked_after_event', v_locked,
    'net_available', v_available,
    'net_locked', v_locked - v_platform_fee - v_gateway_fee
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. FUNÇÃO PARA ATUALIZAR SALDO APÓS VENDA
-- ============================================

CREATE OR REPLACE FUNCTION update_producer_balance_after_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_calculated JSONB;
BEGIN
  -- Só processa se o pedido foi pago
  IF NEW.status = 'paid' AND NEW.payment_status = 'paid' THEN
    -- Calcular saldo
    v_calculated := calculate_producer_balance(NEW.event_id, NEW.producer_id);
    
    -- Inserir ou atualizar saldo
    INSERT INTO public.producer_balances (
      producer_id, event_id,
      total_revenue, total_platform_fees, total_gateway_fees,
      available_before_event, locked_after_event
    )
    VALUES (
      NEW.producer_id, NEW.event_id,
      (v_calculated->>'total_revenue')::DECIMAL,
      (v_calculated->>'platform_fee')::DECIMAL,
      (v_calculated->>'gateway_fee')::DECIMAL,
      (v_calculated->>'available_before_event')::DECIMAL,
      (v_calculated->>'locked_after_event')::DECIMAL
    )
    ON CONFLICT (producer_id, event_id) 
    DO UPDATE SET
      total_revenue = EXCLUDED.total_revenue,
      total_platform_fees = EXCLUDED.total_platform_fees,
      total_gateway_fees = EXCLUDED.total_gateway_fees,
      available_before_event = EXCLUDED.available_before_event,
      locked_after_event = EXCLUDED.locked_after_event,
      updated_at = now();
    
    -- Registrar histórico
    INSERT INTO public.producer_balance_history (
      producer_id, event_id, movement_type, direction, amount,
      reference_type, reference_id, description,
      balance_available_after, balance_locked_after
    )
    VALUES (
      NEW.producer_id, NEW.event_id, 'sale', 'credit', NEW.total,
      'order', NEW.id, 'Venda de ingresso - Pedido ' || LEFT(NEW.id::TEXT, 8),
      (v_calculated->>'available_before_event')::DECIMAL,
      (v_calculated->>'locked_after_event')::DECIMAL
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar saldo após insert/update de order
DROP TRIGGER IF EXISTS trigger_update_balance_on_order ON public.orders;
CREATE TRIGGER trigger_update_balance_on_order
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_producer_balance_after_sale();

-- ============================================
-- 6. FUNÇÃO PARA LIBERAR SALDO APÓS EVENTO
-- ============================================

CREATE OR REPLACE FUNCTION release_producer_balance_after_event(p_event_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_balance public.producer_balances%ROWTYPE;
  v_released DECIMAL(10,2);
BEGIN
  -- Buscar saldo do evento
  SELECT * INTO v_balance 
  FROM public.producer_balances 
  WHERE event_id = p_event_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo não encontrado');
  END IF;
  
  -- Calcular valor a liberar (25% menos taxas)
  v_released := v_balance.locked_after_event - v_balance.total_platform_fees - v_balance.total_gateway_fees - v_balance.total_chargebacks;
  
  -- Atualizar saldo
  UPDATE public.producer_balances
  SET 
    available_before_event = available_before_event + v_released,
    locked_after_event = 0,
    updated_at = now()
  WHERE id = v_balance.id;
  
  -- Registrar histórico
  INSERT INTO public.producer_balance_history (
    producer_id, event_id, movement_type, direction, amount,
    description, balance_available_after, balance_locked_after
  )
  VALUES (
    v_balance.producer_id, v_balance.event_id, 'release_after_event', 'credit', v_released,
    'Liberação de saldo pós-evento (25% - taxas)',
    v_balance.available_before_event + v_released,
    0
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'released_amount', v_released,
    'new_available', v_balance.available_before_event + v_released
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. FUNÇÃO PARA SOLICITAR SAQUE
-- ============================================

CREATE OR REPLACE FUNCTION request_producer_withdrawal(
  p_producer_id UUID,
  p_event_id UUID,
  p_amount DECIMAL,
  p_bank_account_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_balance public.producer_balances%ROWTYPE;
  v_bank_account public.bank_accounts%ROWTYPE;
  v_available DECIMAL(10,2);
  v_withdrawal_id UUID;
  v_event_status TEXT;
  v_withdrawal_type TEXT;
BEGIN
  -- Verificar se o evento existe e seu status
  SELECT status INTO v_event_status 
  FROM public.events 
  WHERE id = p_event_id;
  
  -- Buscar saldo
  SELECT * INTO v_balance 
  FROM public.producer_balances 
  WHERE producer_id = p_producer_id AND event_id = p_event_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo não encontrado para este evento');
  END IF;
  
  -- Determinar tipo de saque baseado no status do evento
  IF v_event_status = 'completed' OR v_event_status = 'finished' OR v_event_status = 'done' THEN
    -- Evento finalizado: pode sacar dos 25%
    v_available := v_balance.available_before_event;
    v_withdrawal_type := 'after_event';
  ELSE
    -- Evento não finalizado: só pode sacar dos 75%
    v_available := v_balance.available_before_event - v_balance.pending_withdrawal;
    v_withdrawal_type := 'before_event';
  END IF;
  
  -- Verificar se tem saldo suficiente
  IF p_amount > v_available THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente', 'available', v_available);
  END IF;
  
  -- Buscar dados bancários
  SELECT * INTO v_bank_account 
  FROM public.bank_accounts 
  WHERE id = p_bank_account_id AND producer_id = p_producer_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conta bancária não encontrada');
  END IF;
  
  -- Criar solicitação de saque
  INSERT INTO public.producer_withdrawals (
    producer_id, event_id, amount, withdrawal_type,
    bank_account_id, bank_name, account_name, agency, account_number,
    pix_key, pix_key_type,
    expected_payment_date,
    balance_snapshot
  )
  VALUES (
    p_producer_id, p_event_id, p_amount, v_withdrawal_type,
    p_bank_account_id, v_bank_account.bank_name, v_bank_account.account_name,
    v_bank_account.agency, v_bank_account.account_number,
    v_bank_account.pix_key, v_bank_account.pix_key_type,
    CURRENT_DATE + INTERVAL '2 days',  -- D+2
    jsonb_build_object(
      'available_before', v_balance.available_before_event,
      'locked_before', v_balance.locked_after_event,
      'requested_amount', p_amount
    )
  )
  RETURNING id INTO v_withdrawal_id;
  
  -- Atualizar saldo pendente
  UPDATE public.producer_balances
  SET 
    pending_withdrawal = pending_withdrawal + p_amount,
    updated_at = now()
  WHERE id = v_balance.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'amount', p_amount,
    'type', v_withdrawal_type,
    'expected_payment', CURRENT_DATE + INTERVAL '2 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. FUNÇÃO PARA PROCESSAR SAQUE (ADMIN)
-- ============================================

CREATE OR REPLACE FUNCTION process_producer_withdrawal(
  p_withdrawal_id UUID,
  p_admin_id UUID,
  p_status TEXT,  -- 'paid' ou 'rejected'
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_withdrawal public.producer_withdrawals%ROWTYPE;
  v_balance public.producer_balances%ROWTYPE;
BEGIN
  -- Buscar saque
  SELECT * INTO v_withdrawal 
  FROM public.producer_withdrawals 
  WHERE id = p_withdrawal_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saque não encontrado');
  END IF;
  
  IF v_withdrawal.status NOT IN ('requested', 'under_review', 'processing') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saque não pode ser processado (status: ' || v_withdrawal.status || ')');
  END IF;
  
  -- Atualizar status do saque
  UPDATE public.producer_withdrawals
  SET 
    status = p_status,
    processed_by = p_admin_id,
    processed_at = now(),
    paid_at = CASE WHEN p_status = 'paid' THEN now() ELSE NULL END,
    rejection_reason = p_rejection_reason
  WHERE id = p_withdrawal_id;
  
  -- Buscar saldo
  SELECT * INTO v_balance 
  FROM public.producer_balances 
  WHERE producer_id = v_withdrawal.producer_id AND event_id = v_withdrawal.event_id;
  
  IF p_status = 'paid' THEN
    -- Saque aprovado: mover de pending para withdrawn
    UPDATE public.producer_balances
    SET 
      pending_withdrawal = pending_withdrawal - v_withdrawal.amount,
      total_withdrawn = total_withdrawn + v_withdrawal.amount,
      updated_at = now()
    WHERE id = v_balance.id;
    
    -- Registrar histórico
    INSERT INTO public.producer_balance_history (
      producer_id, event_id, movement_type, direction, amount,
      reference_type, reference_id, description
    )
    VALUES (
      v_withdrawal.producer_id, v_withdrawal.event_id, 'withdrawal', 'debit', v_withdrawal.amount,
      'withdrawal', p_withdrawal_id, 'Saque aprovado e processado'
    );
  ELSE
    -- Saque rejeitado: devolver ao disponível
    UPDATE public.producer_balances
    SET 
      pending_withdrawal = pending_withdrawal - v_withdrawal.amount,
      updated_at = now()
    WHERE id = v_balance.id;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'status', p_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. VIEW PARA RESUMO FINANCEIRO DO PRODUTOR
-- ============================================

CREATE OR REPLACE VIEW public.producer_financial_summary AS
SELECT 
  pb.producer_id,
  pb.event_id,
  e.title AS event_title,
  e.start_date AS event_date,
  e.status AS event_status,
  
  -- Saldos
  pb.available_before_event AS available_now,
  pb.locked_after_event AS locked_until_event,
  pb.pending_withdrawal,
  pb.total_withdrawn,
  
  -- Totais
  pb.total_revenue,
  pb.total_platform_fees,
  pb.total_gateway_fees,
  pb.total_chargebacks,
  
  -- Projeção
  CASE 
    WHEN e.status IN ('completed', 'finished', 'done') THEN
      pb.available_before_event + pb.locked_after_event - pb.total_platform_fees - pb.total_gateway_fees
    ELSE
      pb.available_before_event
  END AS projected_total,
  
  -- Status de liberação
  CASE 
    WHEN e.status IN ('completed', 'finished', 'done') THEN 'liberado'
    WHEN e.start_date < now() THEN 'aguardando_finalizacao'
    ELSE 'antes_evento'
  END AS release_status
  
FROM public.producer_balances pb
JOIN public.events e ON pb.event_id = e.id;

-- ============================================
-- 10. POLÍTICAS DE SEGURANÇA (RLS)
-- ============================================

ALTER TABLE public.producer_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producer_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producer_balance_history ENABLE ROW LEVEL SECURITY;

-- Producer balances policies
CREATE POLICY "Producers can view own balances"
  ON public.producer_balances FOR SELECT
  TO authenticated
  USING (producer_id = auth.uid());

-- Producer withdrawals policies
CREATE POLICY "Producers can view own withdrawals"
  ON public.producer_withdrawals FOR SELECT
  TO authenticated
  USING (producer_id = auth.uid());

CREATE POLICY "Producers can create withdrawal requests"
  ON public.producer_withdrawals FOR INSERT
  TO authenticated
  WITH CHECK (producer_id = auth.uid());

-- Producer balance history policies
CREATE POLICY "Producers can view own history"
  ON public.producer_balance_history FOR SELECT
  TO authenticated
  USING (producer_id = auth.uid());

-- Admin policies
CREATE POLICY "Admins can manage all withdrawals"
  ON public.producer_withdrawals FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can view all balances"
  ON public.producer_balances FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ============================================
-- 11. COMENTÁRIOS
-- ============================================

COMMENT ON TABLE public.producer_balances IS 'Saldos financeiros dos produtores por evento (modelo 75/25)';
COMMENT ON TABLE public.producer_withdrawals IS 'Solicitações de saque dos produtores';
COMMENT ON TABLE public.producer_balance_history IS 'Histórico de movimentações financeiras dos produtores';

COMMENT ON COLUMN public.producer_balances.available_before_event IS '75% da receita liberado antes do evento';
COMMENT ON COLUMN public.producer_balances.locked_after_event IS '25% da receita retido até após o evento';
