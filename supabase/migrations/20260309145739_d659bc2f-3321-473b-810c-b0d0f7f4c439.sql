-- Add UNIQUE constraint on promoter_events(tracking_code, event_id)
ALTER TABLE promoter_events ADD CONSTRAINT promoter_events_tracking_code_event_id_key UNIQUE (tracking_code, event_id);

-- Create trigger for handle_promoter_commission if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_promoter_commission') THEN
    CREATE TRIGGER trg_promoter_commission
      AFTER INSERT OR UPDATE ON orders
      FOR EACH ROW
      EXECUTE FUNCTION handle_promoter_commission();
  END IF;
END $$;