-- Enhanced Certificate System Migration
-- Sistema avançado de certificados com templates, múltiplos assinantes e preferências

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

CREATE POLICY "Templates are viewable by everyone" 
ON public.certificate_templates
FOR SELECT TO authenticated, anon
USING (is_active = true);

-- Apenas admins podem gerenciar templates (via service role ou função específica)
CREATE POLICY "Only admins can manage templates"
ON public.certificate_templates
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================================================
-- 2. TABELA: Assinantes de Certificados (Múltiplos por evento)
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

-- Produtores podem gerenciar assinantes dos seus eventos
CREATE POLICY "Producers can manage signers for their events"
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

-- Membros da equipe podem visualizar assinantes
CREATE POLICY "Team members can view signers"
ON public.certificate_signers
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM event_staff es
    WHERE es.event_id = certificate_signers.event_id
    AND es.user_id = auth.uid()
  )
);

-- Índice para busca eficiente por evento
CREATE INDEX IF NOT EXISTS idx_certificate_signers_event 
ON public.certificate_signers(event_id);

CREATE INDEX IF NOT EXISTS idx_certificate_signers_order 
ON public.certificate_signers(event_id, display_order);

-- =============================================================================
-- 3. TABELA: Preferências de Participantes (Opt-out)
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

-- RLS para preferências
ALTER TABLE public.certificate_participant_prefs ENABLE ROW LEVEL SECURITY;

-- Usuários podem gerenciar suas próprias preferências
CREATE POLICY "Users can manage their own preferences" 
ON public.certificate_participant_prefs
FOR ALL TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Produtores podem ver preferências para seus eventos (mas não editar)
CREATE POLICY "Producers can view preferences for their events"
ON public.certificate_participant_prefs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = certificate_participant_prefs.event_id 
    AND events.producer_id = auth.uid()
  )
);

-- Índices para busca eficiente
CREATE INDEX IF NOT EXISTS idx_cert_participant_prefs_user 
ON public.certificate_participant_prefs(user_id);

CREATE INDEX IF NOT EXISTS idx_cert_participant_prefs_event 
ON public.certificate_participant_prefs(event_id);

CREATE INDEX IF NOT EXISTS idx_cert_participant_prefs_optout 
ON public.certificate_participant_prefs(event_id, opt_out) 
WHERE opt_out = true;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_cert_participant_prefs_updated_at
  BEFORE UPDATE ON public.certificate_participant_prefs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 4. ATUALIZAR TABELA EVENTS - Configurações Avançadas
-- =============================================================================
-- Adicionar colunas de configuração avançada se não existirem
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS has_certificates BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS selected_template_id TEXT 
  REFERENCES public.certificate_templates(id),
ADD COLUMN IF NOT EXISTS custom_background_url TEXT,
ADD COLUMN IF NOT EXISTS certificate_config JSONB DEFAULT '{
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
}'::jsonb,
ADD COLUMN IF NOT EXISTS certificate_text_config JSONB DEFAULT '{
  "title": "Certificado de Participação",
  "subtitle": "Certificamos que",
  "bodyText": "participou do evento",
  "showDate": true,
  "showLocation": true,
  "showWorkload": true,
  "footerText": "Emitido pela plataforma TicketHall"
}'::jsonb,
ADD COLUMN IF NOT EXISTS certificate_colors JSONB DEFAULT '{
  "primary": "#EA580B",
  "secondary": "#1E293B",
  "background": "#FFFFFF",
  "text": "#1E293B"
}'::jsonb,
ADD COLUMN IF NOT EXISTS certificate_fields JSONB DEFAULT '{
  "showParticipantName": true,
  "showEventTitle": true,
  "showEventDate": true,
  "showEventLocation": true,
  "showWorkload": true,
  "showVerificationCode": true,
  "showQrCode": true,
  "showSigners": true,
  "showLogo": true
}'::jsonb;

-- Adicionar foreign key constraint para template_id se a coluna foi criada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'events_selected_template_id_fkey'
    AND table_name = 'events'
  ) THEN
    ALTER TABLE public.events 
    ADD CONSTRAINT events_selected_template_id_fkey 
    FOREIGN KEY (selected_template_id) 
    REFERENCES public.certificate_templates(id);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Constraint já existe ou outro erro, ignorar
    NULL;
END $$;

-- =============================================================================
-- 5. ATUALIZAR TABELA CERTIFICATES - Campos Adicionais
-- =============================================================================
-- Verificar se a coluna event_id existe, se não, adicionar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'certificates' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE public.certificates ADD COLUMN event_id UUID REFERENCES public.events(id);
  END IF;
END $$;

ALTER TABLE public.certificates
ADD COLUMN IF NOT EXISTS workload_hours INTEGER,
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revoked_reason TEXT,
ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS qr_code_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Criar índice para event_id se a coluna existir
CREATE INDEX IF NOT EXISTS idx_certificates_event_id 
ON public.certificates(event_id) 
WHERE event_id IS NOT NULL;

-- Índice para busca de certificados revogados
CREATE INDEX IF NOT EXISTS idx_certificates_revoked 
ON public.certificates(revoked_at) 
WHERE revoked_at IS NOT NULL;

-- Índice para busca por código (usado na verificação pública)
CREATE INDEX IF NOT EXISTS idx_certificates_code 
ON public.certificates(certificate_code);

-- Índice composto para validação
CREATE INDEX IF NOT EXISTS idx_certificates_validation 
ON public.certificates(id, revoked_at, certificate_code);

-- =============================================================================
-- 6. FUNÇÕES DE NEGÓCIO
-- =============================================================================

-- Função para gerar código de certificado collision-resistant
CREATE OR REPLACE FUNCTION public.generate_certificate_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  exists_check BOOLEAN;
  attempts INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  LOOP
    -- Gerar código: TICK-{8 chars hex}-{6 chars base36 timestamp}
    new_code := 'TICK-' || 
                upper(substring(md5(random()::text) from 1 for 8)) || '-' ||
                upper(to_char(now(), 'YYMMDD')) ||
                upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 3));
    
    -- Verificar se já existe
    SELECT EXISTS(
      SELECT 1 FROM certificates WHERE certificate_code = new_code
    ) INTO exists_check;
    
    -- Se não existe, retornar
    IF NOT exists_check THEN
      RETURN new_code;
    END IF;
    
    -- Incrementar tentativas
    attempts := attempts + 1;
    
    -- Se atingiu o máximo de tentativas, usar timestamp completo
    IF attempts >= max_attempts THEN
      new_code := 'TICK-' || 
                  upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8)) || '-' ||
                  upper(to_char(clock_timestamp(), 'YYMMDDHH24MISSMS'));
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se certificado é válido
CREATE OR REPLACE FUNCTION public.is_certificate_valid(cert_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM certificates 
    WHERE id = cert_id 
    AND revoked_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar validade por código (para uso público)
CREATE OR REPLACE FUNCTION public.is_certificate_code_valid(p_code TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  revoked BOOLEAN,
  certificate_id UUID,
  event_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (c.revoked_at IS NULL) as valid,
    (c.revoked_at IS NOT NULL) as revoked,
    c.id as certificate_id,
    c.event_id
  FROM certificates c
  WHERE c.certificate_code = p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para revogar certificado
DROP FUNCTION IF EXISTS public.revoke_certificate(UUID, TEXT, UUID);

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

-- Função para verificar se usuário optou por não receber certificado
CREATE OR REPLACE FUNCTION public.has_opted_out_certificate(
  p_event_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_opt_out BOOLEAN;
BEGIN
  SELECT opt_out INTO v_opt_out
  FROM certificate_participant_prefs
  WHERE event_id = p_event_id
  AND user_id = p_user_id;
  
  RETURN COALESCE(v_opt_out, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter nome preferencial do participante
CREATE OR REPLACE FUNCTION public.get_preferred_certificate_name(
  p_event_id UUID,
  p_user_id UUID,
  p_default_name TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_preferred_name TEXT;
  v_profile_name TEXT;
BEGIN
  -- Verificar preferência do usuário
  SELECT preferred_name INTO v_preferred_name
  FROM certificate_participant_prefs
  WHERE event_id = p_event_id
  AND user_id = p_user_id;
  
  IF v_preferred_name IS NOT NULL AND v_preferred_name != '' THEN
    RETURN v_preferred_name;
  END IF;
  
  -- Usar nome do perfil
  SELECT full_name INTO v_profile_name
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_profile_name, p_default_name, 'Participante');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 7. VIEWS PARA CONSULTAS COMUNS
-- =============================================================================

-- View para certificados com informações de evento (uso interno)
CREATE OR REPLACE VIEW public.certificates_with_event AS
SELECT 
  c.*,
  e.title as event_title,
  e.start_date as event_start_date,
  e.end_date as event_end_date,
  e.venue_name as event_venue,
  p.full_name as participant_full_name,
  au.email as participant_email
FROM certificates c
JOIN events e ON e.id = c.event_id
LEFT JOIN profiles p ON p.id = c.user_id
LEFT JOIN auth.users au ON au.id = c.user_id;

-- View para certificados válidos apenas
CREATE OR REPLACE VIEW public.valid_certificates AS
SELECT *
FROM certificates_with_event
WHERE revoked_at IS NULL;

-- =============================================================================
-- 8. RLS POLICIES ADICIONAIS PARA CERTIFICATES
-- =============================================================================

-- Política para atualização de certificados (produtores podem atualizar campos específicos)
CREATE POLICY "Producers can update certificate metadata"
ON public.certificates
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = certificates.event_id 
    AND events.producer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = certificates.event_id 
    AND events.producer_id = auth.uid()
  )
);

-- =============================================================================
-- 9. TRIGGER PARA VALIDAÇÃO ANTES DE INSERIR CERTIFICADO
-- =============================================================================
CREATE OR REPLACE FUNCTION public.validate_certificate_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se usuário optou por não receber certificado
  IF public.has_opted_out_certificate(NEW.event_id, NEW.user_id) THEN
    RAISE EXCEPTION 'User has opted out of receiving certificate for this event';
  END IF;
  
  -- Usar nome preferencial se disponível
  NEW.attendee_name := public.get_preferred_certificate_name(
    NEW.event_id, 
    NEW.user_id, 
    NEW.attendee_name
  );
  
  -- Gerar código se não fornecido
  IF NEW.certificate_code IS NULL OR NEW.certificate_code = '' THEN
    NEW.certificate_code := public.generate_certificate_code();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_certificate_before_insert ON public.certificates;
CREATE TRIGGER validate_certificate_before_insert
  BEFORE INSERT ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_certificate_insert();

-- =============================================================================
-- 10. COMENTÁRIOS DOCUMENTANDO AS TABELAS
-- =============================================================================
COMMENT ON TABLE public.certificate_templates IS 'Templates disponíveis para certificados';
COMMENT ON TABLE public.certificate_signers IS 'Assinantes/assinaturas para certificados por evento';
COMMENT ON TABLE public.certificate_participant_prefs IS 'Preferências de participantes sobre certificados (opt-out)';
COMMENT ON COLUMN public.certificates.revoked_at IS 'Data de revogação do certificado';
COMMENT ON COLUMN public.certificates.revoked_reason IS 'Motivo da revogação';
COMMENT ON COLUMN public.certificates.version IS 'Versão do certificado (incrementada em reemissões)';
COMMENT ON COLUMN public.certificates.qr_code_url IS 'URL do QR code para verificação';
COMMENT ON COLUMN public.certificates.linkedin_url IS 'URL para compartilhamento no LinkedIn';
