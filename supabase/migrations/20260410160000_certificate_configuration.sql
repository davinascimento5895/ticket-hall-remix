-- Certificate Configuration Migration
-- Adiciona configurações avançadas de certificados

-- 1. Adicionar colunas de configuração na tabela events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS certificate_config JSONB DEFAULT '{
  "showEventDate": true,
  "showEventTime": false,
  "showEventLocation": true,
  "showWorkload": false,
  "workloadHours": 0,
  "showProducerName": true,
  "showProducerSignature": false,
  "customText": null,
  "template": "default",
  "primaryColor": null,
  "showLogo": true
}'::jsonb;

-- 2. Adicionar campos extras na tabela certificates
ALTER TABLE public.certificates
ADD COLUMN IF NOT EXISTS workload_hours INTEGER,
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revoked_reason TEXT,
ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS previous_version_id UUID REFERENCES public.certificates(id);

-- 3. Criar tabela de configurações de participante (opt-out)
CREATE TABLE IF NOT EXISTS public.participant_certificate_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opt_out BOOLEAN DEFAULT false,
  preferred_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.participant_certificate_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences" 
ON public.participant_certificate_prefs
FOR ALL TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Producers can view preferences for their events"
ON public.participant_certificate_prefs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = participant_certificate_prefs.event_id 
    AND events.producer_id = auth.uid()
  )
);

-- 4. Criar índices
CREATE INDEX IF NOT EXISTS idx_certificates_revoked ON public.certificates(revoked_at) WHERE revoked_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_participant_cert_prefs_user ON public.participant_certificate_prefs(user_id);
CREATE INDEX IF NOT EXISTS idx_participant_cert_prefs_event ON public.participant_certificate_prefs(event_id);

-- 5. Função para verificar se certificado é válido (não revogado)
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

-- 6. Função para revogar certificado
CREATE OR REPLACE FUNCTION public.revoke_certificate(
  cert_id UUID,
  reason TEXT,
  revoked_by_user UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE certificates
  SET 
    revoked_at = now(),
    revoked_reason = reason,
    revoked_by = revoked_by_user
  WHERE id = cert_id
  AND revoked_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger para atualizar updated_at em participant_certificate_prefs
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_participant_cert_prefs_updated_at ON public.participant_certificate_prefs;
CREATE TRIGGER update_participant_cert_prefs_updated_at
  BEFORE UPDATE ON public.participant_certificate_prefs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
