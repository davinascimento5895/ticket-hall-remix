-- ============================================
-- CONFIGURAÇÃO: Cron Job para Limpar Listagens Expiradas
-- ============================================

-- Nota: Esta migration cria a configuração necessária para o cron job
-- O Supabase Cron deve estar habilitado no projeto

-- Configurar o cron job para rodar diariamente às 00:00
-- Comando para executar via Supabase CLI ou Dashboard:

/*
  Supabase Dashboard > Database > Cron Jobs:
  
  Name: cleanup-expired-resale-listings
  Schedule: 0 0 * * *
  HTTP Request:
    Method: POST
    URL: https://[PROJECT_REF].supabase.co/functions/v1/cleanup-resale-listings
    Headers:
      Authorization: Bearer [CRON_SECRET]
*/

-- Alternativa: Criar usando pg_cron (se disponível)
DO $$
BEGIN
  -- Verificar se pg_cron está disponível
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remover job existente se houver
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'cleanup-expired-resale-listings';
    
    -- Criar novo job
    PERFORM cron.schedule(
      'cleanup-expired-resale-listings',
      '0 0 * * *', -- Todo dia à meia-noite
      $job$ SELECT net.http_post(
        url:='https://' || current_setting('app.settings.project_ref', true) || '.supabase.co/functions/v1/cleanup-resale-listings',
        headers:='{"Authorization": "Bearer ' || current_setting('app.settings.cron_secret', true) || '"}'::jsonb
      ) $job$
    );
    
    RAISE NOTICE 'Cron job criado com sucesso';
  ELSE
    RAISE NOTICE 'pg_cron não disponível. Configure manualmente no Dashboard.';
  END IF;
END $$;

-- ============================================
-- VARIÁVEIS DE AMBIENTE NECESSÁRIAS
-- ============================================

/*
Adicionar ao arquivo .env ou configurações do Supabase:

CRON_SECRET=seu_token_secreto_aqui_aleatorio

Este token é usado para autenticar chamadas do cron job à edge function.
*/

COMMENT ON TABLE resale_listings IS 'Listagens de revenda. Listagens expiradas são limpas automaticamente pelo cron job diário.';
