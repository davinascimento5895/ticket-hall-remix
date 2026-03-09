
-- 1. Trigger: auto-create profile + buyer role on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Trigger: update updated_at on profiles
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Trigger: update updated_at on events
CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Trigger: update updated_at on orders
CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Trigger: auto-generate promoter commission when order is paid
CREATE TRIGGER on_order_paid_promoter_commission
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_promoter_commission();

-- 6. Trigger: increment submissions count on interest list
CREATE TRIGGER on_interest_list_submission
  AFTER INSERT ON public.interest_list_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_list_submissions();

-- 7. Trigger: update updated_at on financial_transactions
CREATE TRIGGER set_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Trigger: update updated_at on interest_lists
CREATE TRIGGER set_interest_lists_updated_at
  BEFORE UPDATE ON public.interest_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
