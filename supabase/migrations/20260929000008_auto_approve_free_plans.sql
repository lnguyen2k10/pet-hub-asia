-- =============================================================================
-- Migration: Auto-approve free plans
-- Date: 2026-09-29
-- =============================================================================

CREATE OR REPLACE FUNCTION public.auto_approve_free_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_price numeric;
  v_plan_duration int;
BEGIN
  IF NEW.plan_id IS NOT NULL AND NEW.status = 'pending' THEN
    SELECT price_amount, duration_days INTO v_plan_price, v_plan_duration FROM public.membership_plans WHERE id = NEW.plan_id;
    IF v_plan_price = 0 THEN
      -- Dùng UPDATE để kích hoạt trigger process_approved_membership
      UPDATE public.membership_requests
      SET status = 'approved',
          starts_at = now(),
          expires_at = now() + (v_plan_duration || ' days')::interval,
          reviewed_at = now()
      WHERE id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_auto_approve_free_plan ON public.membership_requests;
CREATE TRIGGER tr_auto_approve_free_plan
AFTER INSERT ON public.membership_requests
FOR EACH ROW EXECUTE FUNCTION public.auto_approve_free_plan();
