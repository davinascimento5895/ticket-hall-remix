-- Recria o job diario de cleanup com o secret atual e a URL correta do projeto novo.
-- Isso evita depender de current_setting() sem configuracao persistida no banco.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'cleanup-expired-resale-listings';

    PERFORM cron.schedule(
      'cleanup-expired-resale-listings',
      '0 0 * * *',
      $job$ SELECT net.http_post(
        url:='https://wmuwctsmuagetcjqeboz.supabase.co/functions/v1/cleanup-resale-listings',
        headers:='{"Authorization": "Bearer ljlengapdqwrnfqqajhbqqzwcpheojvk"}'::jsonb
      ) $job$
    );

    RAISE NOTICE 'cleanup-expired-resale-listings cron atualizado';
  ELSE
    RAISE NOTICE 'pg_cron nao disponivel. Configure manualmente no Dashboard.';
  END IF;
END $$;