-- ============================================================
-- Fix checkin_scan_logs result CHECK constraint
-- ============================================================
-- Problem: The validate-checkin edge function writes result values
-- (invalid_qr, inactive, race_condition) that violate the CHECK constraint.
-- The constraint only allows: success, already_used, invalid, wrong_list, not_found.
-- Fix: Replace the constraint with one that includes all actual values.

ALTER TABLE public.checkin_scan_logs
  DROP CONSTRAINT IF EXISTS checkin_scan_logs_result_check;

ALTER TABLE public.checkin_scan_logs
  ADD CONSTRAINT checkin_scan_logs_result_check
  CHECK (result IN ('success', 'already_used', 'invalid', 'invalid_qr', 'not_found', 'wrong_list', 'inactive', 'race_condition', 'list_inactive'));
