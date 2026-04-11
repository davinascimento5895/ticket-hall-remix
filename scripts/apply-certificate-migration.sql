-- Script para aplicar a migration do sistema de certificados
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)

-- =============================================================================
-- VERIFICAÇÃO DO ESTADO ATUAL
-- =============================================================================
DO $$
DECLARE
  has_cert_config BOOLEAN;
  has_has_cert BOOLEAN;
  has_event_id BOOLEAN;
BEGIN
  -- Verificar colunas existentes
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'certificate_config'
  ) INTO has_cert_config;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'has_certificates'
  ) INTO has_has_cert;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'certificates' AND column_name = 'event_id'
  ) INTO has_event_id;
  
  RAISE NOTICE 'Estado atual do banco:';
  RAISE NOTICE '- events.certificate_config: %', CASE WHEN has_cert_config THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE '- events.has_certificates: %', CASE WHEN has_has_cert THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE '- certificates.event_id: %', CASE WHEN has_event_id THEN 'EXISTS' ELSE 'MISSING' END;
END $$;

-- =============================================================================
-- 1. TABELA: Templates de Certificados
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  default_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir templates padrão
INSERT INTO public.certificate_templates (id, name, description, default_config) VALUES
('default', 'Padrão', 'Template padrão com design TicketHall', '{
  "layout": "classic",
  "showBorder": true,
  "showLogo": true,
  "primaryColor": "#EA580B",
  "secondaryColor": "#1E293B"
}'::jsonb),
('modern', 'Moderno', 'Design moderno e minimalista', '{
  "layout": "modern",
  "showBorder": false,
  "showLogo": true,
  "primaryColor": "#3B82F6",
  "secondaryColor": "#1E293B"
}'::jsonb),
('academic', 'Acadêmico', 'Estilo formal para instituições educacionais', '{
  "layout": "academic",
  "showBorder": true,
  "showLogo": true,
  "primaryColor": "#1E40AF",
  "secondaryColor": "#475569"
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- RLS para templates
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Templates are viewable by everyone" 
ON public.certificate_templates
FOR SELECT TO authenticated, anon
USING (is_active = true);

-- =============================================================================
-- 2. TABELA: Assinantes de Certificados
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.certificate_signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  signature_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para assinantes
ALTER TABLE public.certificate_signers ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Producers can manage signers for their events"
ON public.certificate_signers
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = certificate_signers.event_id 
    AND events.producer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = certificate_signers.event_id 
    AND events.producer_id = auth.uid()
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_certificate_signers_event 
ON public.certificate_signers(event_id);

-- =============================================================================
-- 3. TABELA: Preferências de Participantes
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.certificate_participant_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opt_out BOOLEAN DEFAULT false,
  preferred_name TEXT,
  consent_cpf BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.certificate_participant_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can manage their own preferences" 
ON public.certificate_participant_prefs
FOR ALL TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 4. ATUALIZAR TABELA EVENTS
-- =============================================================================

-- Adicionar has_certificates se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'has_certificates'
  ) THEN
    ALTER TABLE public.events ADD COLUMN has_certificates BOOLEAN DEFAULT false;
    RAISE NOTICE 'Adicionada coluna events.has_certificates';
  END IF;
END $$;

-- Adicionar certificate_config se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'certificate_config'
  ) THEN
    ALTER TABLE public.events ADD COLUMN certificate_config JSONB DEFAULT '{
      "templateId": "executive",
      "primaryColor": "#1a365d",
      "secondaryColor": "#c9a227",
      "fields": {
        "showEventName": true,
        "showParticipantName": true,
        "showParticipantLastName": true,
        "showCPF": false,
        "showEventDate": true,
        "showEventLocation": true,
        "showWorkload": false,
        "showSigners": true
      },
      "textConfig": {
        "title": "CERTIFICADO DE PARTICIPAÇÃO",
        "introText": "Certificamos que",
        "participationText": "participou do evento",
        "conclusionText": "Comprove sua participação através do código de verificação."
      },
      "signers": [],
      "backgroundUrl": null,
      "workloadHours": 0
    }'::jsonb;
    RAISE NOTICE 'Adicionada coluna events.certificate_config';
  END IF;
END $$;

-- Adicionar outras colunas opcionais
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS selected_template_id TEXT REFERENCES public.certificate_templates(id),
ADD COLUMN IF NOT EXISTS custom_background_url TEXT,
ADD COLUMN IF NOT EXISTS certificate_text_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS certificate_colors JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS certificate_fields JSONB DEFAULT '{}'::jsonb;

-- =============================================================================
-- 5. ATUALIZAR TABELA CERTIFICATES
-- =============================================================================

-- Verificar se event_id existe em certificates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'certificates' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE public.certificates ADD COLUMN event_id UUID REFERENCES public.events(id);
    RAISE NOTICE 'Adicionada coluna certificates.event_id';
  END IF;
END $$;

-- Adicionar outras colunas
ALTER TABLE public.certificates
ADD COLUMN IF NOT EXISTS workload_hours INTEGER,
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revoked_reason TEXT,
ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS qr_code_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Índices
CREATE INDEX IF NOT EXISTS idx_certificates_revoked 
ON public.certificates(revoked_at) 
WHERE revoked_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_certificates_code 
ON public.certificates(certificate_code);

-- =============================================================================
-- 6. FUNÇÕES
-- =============================================================================

CREATE OR REPLACE FUNCTION public.generate_certificate_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  exists_check BOOLEAN;
  attempts INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  LOOP
    new_code := 'TICK-' || 
                upper(substring(md5(random()::text) from 1 for 8)) || '-' ||
                upper(to_char(now(), 'YYMMDD')) ||
                upper(substring(encode(gen_random_bytes(2), 'base64'), 1, 3));
    
    SELECT EXISTS(
      SELECT 1 FROM certificates WHERE certificate_code = new_code
    ) INTO exists_check;
    
    IF NOT exists_check THEN
      RETURN new_code;
    END IF;
    
    attempts := attempts + 1;
    
    IF attempts >= max_attempts THEN
      new_code := 'TICK-' || 
                  upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8)) || '-' ||
                  upper(to_char(clock_timestamp(), 'YYMMDDHH24MISSMS'));
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.revoke_certificate(
  p_cert_id UUID,
  p_reason TEXT,
  p_revoked_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_result BOOLEAN;
BEGIN
  UPDATE certificates
  SET 
    revoked_at = now(),
    revoked_reason = p_reason,
    revoked_by = p_revoked_by,
    version = version + 1
  WHERE id = p_cert_id
  AND revoked_at IS NULL;
  
  GET DIAGNOSTICS v_result = ROW_COUNT;
  
  RETURN v_result > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- VERIFICAÇÃO FINAL
-- =============================================================================
DO $$
DECLARE
  has_cert_config BOOLEAN;
  has_has_cert BOOLEAN;
  has_event_id BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'certificate_config'
  ) INTO has_cert_config;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'has_certificates'
  ) INTO has_has_cert;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'certificates' AND column_name = 'event_id'
  ) INTO has_event_id;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION APLICADA COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Estado final do banco:';
  RAISE NOTICE '- events.certificate_config: %', CASE WHEN has_cert_config THEN 'OK ✓' ELSE 'FALHOU ✗' END;
  RAISE NOTICE '- events.has_certificates: %', CASE WHEN has_has_cert THEN 'OK ✓' ELSE 'FALHOU ✗' END;
  RAISE NOTICE '- certificates.event_id: %', CASE WHEN has_event_id THEN 'OK ✓' ELSE 'FALHOU ✗' END;
END $$;
