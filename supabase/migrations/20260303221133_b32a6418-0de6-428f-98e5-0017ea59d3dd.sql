DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_publication_tables
		WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tickets'
	) THEN
		ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM pg_publication_tables
		WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
	) THEN
		ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM pg_publication_tables
		WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'event_analytics'
	) THEN
		ALTER PUBLICATION supabase_realtime ADD TABLE public.event_analytics;
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM pg_publication_tables
		WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'checkin_sessions'
	) THEN
		ALTER PUBLICATION supabase_realtime ADD TABLE public.checkin_sessions;
	END IF;
END $$;