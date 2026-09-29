CREATE OR REPLACE FUNCTION public.process_approved_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  plan_rec record;
BEGIN
  IF NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status != 'approved') AND NEW.plan_id IS NOT NULL THEN
    SELECT * INTO plan_rec FROM public.membership_plans WHERE id = NEW.plan_id;
    IF FOUND THEN
      UPDATE public.profiles
      SET quota_deals = COALESCE(quota_deals, 0) + COALESCE(plan_rec.quota_deals, 0),
          quota_products = CASE 
            WHEN COALESCE(quota_products, 0) = -1 OR COALESCE(plan_rec.quota_products, 0) = -1 THEN -1 
            ELSE COALESCE(quota_products, 0) + COALESCE(plan_rec.quota_products, 0) 
          END,
          quota_featured_slots = COALESCE(quota_featured_slots, 0) + COALESCE(plan_rec.quota_featured_slots, 0),
          quota_partner_posts = COALESCE(quota_partner_posts, 0) + COALESCE(plan_rec.quota_partner_posts, 0),
          quota_blog_posts = COALESCE(quota_blog_posts, 0) + COALESCE(plan_rec.quota_blog_posts, 0)
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
