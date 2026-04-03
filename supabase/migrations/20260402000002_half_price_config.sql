-- Migration: Configurações de Meia-Entrada para Eventos
-- Created: 2026-04-02

-- ============================================
-- 1. CONFIGURAÇÕES DE MEIA-ENTRADA NO EVENTO
-- ============================================

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS half_price_enabled BOOLEAN DEFAULT false;

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS half_price_require_document BOOLEAN DEFAULT true;

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS half_price_accepted_documents TEXT[] DEFAULT 
  ARRAY['student_id', 'senior_id', 'disability_id', 'id_jovem'];

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS half_price_show_badge_checkin BOOLEAN DEFAULT true;

-- ============================================
-- 2. CAMPOS ADICIONAIS NOS TICKETS (MEIA-ENTRADA)
-- ============================================

-- Já existem na migration 20260304001330, mas garantimos aqui
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS is_half_price BOOLEAN DEFAULT false;

ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS half_price_doc_type TEXT CHECK (
  half_price_doc_type IN ('student_id', 'senior_id', 'disability_id', 'id_jovem')
);

ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS half_price_doc_number TEXT;

ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS half_price_verified_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS half_price_verified_by UUID REFERENCES auth.users(id);

-- ============================================
-- 3. ENRIQUECIMENTO DO LOG DE CHECK-IN
-- ============================================

-- Adicionar campos de rastreabilidade ao log de scans
ALTER TABLE public.checkin_scan_logs 
ADD COLUMN IF NOT EXISTS operator_name TEXT;

ALTER TABLE public.checkin_scan_logs 
ADD COLUMN IF NOT EXISTS operator_email TEXT;

ALTER TABLE public.checkin_scan_logs 
ADD COLUMN IF NOT EXISTS verification_method TEXT CHECK (
  verification_method IN ('qr_scan', 'manual_id', 'list_click')
);

ALTER TABLE public.checkin_scan_logs 
ADD COLUMN IF NOT EXISTS half_price_doc_verified BOOLEAN DEFAULT false;

ALTER TABLE public.checkin_scan_logs 
ADD COLUMN IF NOT EXISTS half_price_doc_number TEXT;

ALTER TABLE public.checkin_scan_logs 
ADD COLUMN IF NOT EXISTS checkin_list_name TEXT;

-- Index para consultas rápidas por operador
CREATE INDEX IF NOT EXISTS idx_checkin_scan_logs_operator ON public.checkin_scan_logs(scanned_by);
CREATE INDEX IF NOT EXISTS idx_checkin_scan_logs_half_price ON public.checkin_scan_logs(half_price_doc_verified);

-- ============================================
-- 4. TABELA DE RELATÓRIO DE MEIA-ENTRADAS
-- ============================================

CREATE TABLE IF NOT EXISTS public.half_price_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  producer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Período do relatório
  report_date DATE DEFAULT CURRENT_DATE,
  
  -- Totais
  total_half_price_sold INTEGER DEFAULT 0,
  total_half_price_checked_in INTEGER DEFAULT 0,
  total_half_price_verified INTEGER DEFAULT 0,
  
  -- Por tipo de documento
  by_student_id INTEGER DEFAULT 0,
  by_senior_id INTEGER DEFAULT 0,
  by_disability_id INTEGER DEFAULT 0,
  by_id_jovem INTEGER DEFAULT 0,
  
  -- Detalhes (JSONB para flexibilidade)
  details JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_half_price_reports_event ON public.half_price_reports(event_id);
CREATE INDEX IF NOT EXISTS idx_half_price_reports_date ON public.half_price_reports(report_date DESC);

-- ============================================
-- 5. FUNÇÃO PARA ATUALIZAR RELATÓRIO
-- ============================================

CREATE OR REPLACE FUNCTION update_half_price_report(p_event_id UUID)
RETURNS void AS $$
DECLARE
  v_producer_id UUID;
BEGIN
  -- Obter producer_id do evento
  SELECT producer_id INTO v_producer_id FROM public.events WHERE id = p_event_id;
  
  -- Inserir ou atualizar relatório
  INSERT INTO public.half_price_reports (
    event_id, producer_id, report_date,
    total_half_price_sold, total_half_price_checked_in, total_half_price_verified,
    by_student_id, by_senior_id, by_disability_id, by_id_jovem
  )
  SELECT 
    p_event_id,
    v_producer_id,
    CURRENT_DATE,
    COUNT(*) FILTER (WHERE is_half_price = true),
    COUNT(*) FILTER (WHERE is_half_price = true AND status = 'used'),
    COUNT(*) FILTER (WHERE is_half_price = true AND half_price_verified_at IS NOT NULL),
    COUNT(*) FILTER (WHERE half_price_doc_type = 'student_id'),
    COUNT(*) FILTER (WHERE half_price_doc_type = 'senior_id'),
    COUNT(*) FILTER (WHERE half_price_doc_type = 'disability_id'),
    COUNT(*) FILTER (WHERE half_price_doc_type = 'id_jovem')
  FROM public.tickets
  WHERE event_id = p_event_id AND is_half_price = true
  ON CONFLICT (event_id, report_date) 
  DO UPDATE SET
    total_half_price_sold = EXCLUDED.total_half_price_sold,
    total_half_price_checked_in = EXCLUDED.total_half_price_checked_in,
    total_half_price_verified = EXCLUDED.total_half_price_verified,
    by_student_id = EXCLUDED.by_student_id,
    by_senior_id = EXCLUDED.by_senior_id,
    by_disability_id = EXCLUDED.by_disability_id,
    by_id_jovem = EXCLUDED.by_id_jovem,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. TRIGGER PARA ATUALIZAR RELATÓRIO AUTOMATICAMENTE
-- ============================================

CREATE OR REPLACE FUNCTION trigger_update_half_price_report()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar relatório quando ticket meia-entrada é alterado
  IF NEW.is_half_price = true THEN
    PERFORM update_half_price_report(NEW.event_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_half_price_report ON public.tickets;
CREATE TRIGGER trigger_half_price_report
  AFTER INSERT OR UPDATE ON public.tickets
  FOR EACH ROW
  WHEN (NEW.is_half_price = true)
  EXECUTE FUNCTION trigger_update_half_price_report();

-- ============================================
-- 7. VIEW PARA CHECK-IN COM DETALHES DO OPERADOR
-- ============================================

CREATE OR REPLACE VIEW public.checkin_details AS
SELECT 
  t.id AS ticket_id,
  t.event_id,
  t.attendee_name,
  t.attendee_email,
  t.tier_id,
  tt.name AS tier_name,
  t.status AS ticket_status,
  t.checked_in_at,
  t.checked_in_by,
  t.is_half_price,
  t.half_price_doc_type,
  t.half_price_doc_number,
  t.half_price_verified_at,
  t.half_price_verified_by,
  
  -- Dados do operador
  p.full_name AS operator_name,
  p.email AS operator_email,
  
  -- Dados do evento
  e.title AS event_title,
  e.start_date AS event_date,
  
  -- Último log de scan
  csl.result AS last_scan_result,
  csl.created_at AS last_scan_at,
  csl.verification_method
  
FROM public.tickets t
LEFT JOIN public.ticket_tiers tt ON t.tier_id = tt.id
LEFT JOIN public.profiles p ON t.checked_in_by = p.id
LEFT JOIN public.events e ON t.event_id = e.id
LEFT JOIN LATERAL (
  SELECT * FROM public.checkin_scan_logs 
  WHERE ticket_id = t.id 
  ORDER BY created_at DESC 
  LIMIT 1
) csl ON true
WHERE t.status = 'used';

-- ============================================
-- 8. POLÍTICAS DE SEGURANÇA
-- ============================================

-- Enable RLS nas tabelas novas
ALTER TABLE public.half_price_reports ENABLE ROW LEVEL SECURITY;

-- Políticas para relatórios de meia-entrada
CREATE POLICY "Producers can view their half-price reports"
  ON public.half_price_reports FOR SELECT
  TO authenticated
  USING (producer_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Política para checkin_scan_logs (já deve existir, mas garantimos)
CREATE POLICY IF NOT EXISTS "Producers can view scan logs for their events"
  ON public.checkin_scan_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.tickets t ON t.event_id = e.id
      WHERE t.id = checkin_scan_logs.ticket_id
      AND e.producer_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 9. COMENTÁRIOS
-- ============================================

COMMENT ON COLUMN public.events.half_price_enabled IS 'Se o evento oferece meia-entrada';
COMMENT ON COLUMN public.events.half_price_require_document IS 'Se é obrigatório informar documento para meia-entrada';
COMMENT ON COLUMN public.events.half_price_accepted_documents IS 'Array com tipos de documentos aceitos';
COMMENT ON COLUMN public.events.half_price_show_badge_checkin IS 'Se mostra indicador visual no check-in';

COMMENT ON COLUMN public.tickets.is_half_price IS 'Se o ingresso é meia-entrada';
COMMENT ON COLUMN public.tickets.half_price_doc_type IS 'Tipo de documento comprobatório';
COMMENT ON COLUMN public.tickets.half_price_doc_number IS 'Número do documento informado';
COMMENT ON COLUMN public.tickets.half_price_verified_at IS 'Quando o documento foi verificado no check-in';
COMMENT ON COLUMN public.tickets.half_price_verified_by IS 'Quem verificou o documento';
