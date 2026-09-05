CREATE OR REPLACE FUNCTION public.auto_approve_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.proof_url IS NOT NULL AND NEW.status = 'pending' THEN
    UPDATE public.membership_requests
    SET status = 'approved',
        starts_at = CURRENT_DATE,
        expires_at = CURRENT_DATE + INTERVAL '1 year',
        reviewed_at = now()
    WHERE id = NEW.id;

    IF NEW.shop_id IS NOT NULL THEN
      UPDATE public.shops SET is_published = true WHERE id = NEW.shop_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.auto_approve_membership() FROM anon, authenticated;

CREATE TRIGGER membership_auto_approve
AFTER INSERT ON public.membership_requests
FOR EACH ROW EXECUTE FUNCTION public.auto_approve_membership();