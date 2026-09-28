-- Ngăn chặn người dùng spam hoặc bypass API để nhận gói Free nhiều lần
CREATE OR REPLACE FUNCTION public.check_single_free_plan_request()
RETURNS TRIGGER AS $$
DECLARE
  v_price_amount numeric;
  v_existing_count integer;
BEGIN
  SELECT price_amount INTO v_price_amount
  FROM public.membership_plans
  WHERE id = NEW.plan_id;

  IF v_price_amount = 0 THEN
    SELECT count(*) INTO v_existing_count
    FROM public.membership_requests
    WHERE user_id = NEW.user_id AND plan_id = NEW.plan_id;

    IF v_existing_count > 0 THEN
      RAISE EXCEPTION 'Mỗi tài khoản chỉ được nhận gói ưu đãi miễn phí này 1 lần duy nhất.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_single_free_plan_request ON public.membership_requests;
CREATE TRIGGER tr_check_single_free_plan_request
BEFORE INSERT ON public.membership_requests
FOR EACH ROW
EXECUTE FUNCTION public.check_single_free_plan_request();
