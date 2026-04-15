
-- 1. Trigger: auto-create profile + buyer role on new user signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'on_auth_user_created'
      AND n.nspname = 'auth'
      AND c.relname = 'users'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 2. Trigger: update updated_at on profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'set_profiles_updated_at'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    CREATE TRIGGER set_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 3. Trigger: update updated_at on events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'set_events_updated_at'
      AND n.nspname = 'public'
      AND c.relname = 'events'
  ) THEN
    CREATE TRIGGER set_events_updated_at
      BEFORE UPDATE ON public.events
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 4. Trigger: update updated_at on orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'set_orders_updated_at'
      AND n.nspname = 'public'
      AND c.relname = 'orders'
  ) THEN
    CREATE TRIGGER set_orders_updated_at
      BEFORE UPDATE ON public.orders
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 5. Trigger: auto-generate promoter commission when order is paid
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'on_order_paid_promoter_commission'
      AND n.nspname = 'public'
      AND c.relname = 'orders'
  ) THEN
    CREATE TRIGGER on_order_paid_promoter_commission
      AFTER UPDATE ON public.orders
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_promoter_commission();
  END IF;
END $$;

-- 6. Trigger: increment submissions count on interest list
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'on_interest_list_submission'
      AND n.nspname = 'public'
      AND c.relname = 'interest_list_submissions'
  ) THEN
    CREATE TRIGGER on_interest_list_submission
      AFTER INSERT ON public.interest_list_submissions
      FOR EACH ROW
      EXECUTE FUNCTION public.increment_list_submissions();
  END IF;
END $$;

-- 7. Trigger: update updated_at on financial_transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'set_financial_transactions_updated_at'
      AND n.nspname = 'public'
      AND c.relname = 'financial_transactions'
  ) THEN
    CREATE TRIGGER set_financial_transactions_updated_at
      BEFORE UPDATE ON public.financial_transactions
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 8. Trigger: update updated_at on interest_lists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'set_interest_lists_updated_at'
      AND n.nspname = 'public'
      AND c.relname = 'interest_lists'
  ) THEN
    CREATE TRIGGER set_interest_lists_updated_at
      BEFORE UPDATE ON public.interest_lists
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
