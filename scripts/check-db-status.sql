-- Script para verificar o estado atual do banco de certificados
-- Execute no SQL Editor do Supabase

SELECT 
  'events' as table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('certificate_config', 'has_certificates', 'selected_template_id', 'custom_background_url')
ORDER BY column_name;

SELECT 
  'certificates' as table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'certificates' 
AND column_name IN ('event_id', 'revoked_at', 'workload_hours', 'version')
ORDER BY column_name;

SELECT 
  table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'certificate_templates'
  ) as certificate_templates_exists,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'certificate_signers'
  ) as certificate_signers_exists,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'certificate_participant_prefs'
  ) as certificate_prefs_exists;
