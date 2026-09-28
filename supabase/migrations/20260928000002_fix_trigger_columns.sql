-- Sửa lại tên cột trong plan_rec thành đúng tên cột của bảng membership_plans
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
        SET quota_deals = COALESCE(quota_deals, 0) + COALESCE(plan_rec.max_deals, 0),
            quota_products = CASE 
              WHEN COALESCE(quota_products, 0) = -1 OR COALESCE(plan_rec.max_products, 0) = -1 THEN -1 
              ELSE COALESCE(quota_products, 0) + COALESCE(plan_rec.max_products, 0) 
            END,
            quota_featured_slots = COALESCE(quota_featured_slots, 0) + COALESCE(plan_rec.featured_slots, 0),
            quota_partner_posts = COALESCE(quota_partner_posts, 0) + COALESCE(plan_rec.max_partner_posts, 0),
            quota_blog_posts = COALESCE(quota_blog_posts, 0) + COALESCE(plan_rec.max_blog_posts, 0)
        WHERE id = NEW.user_id;
      END IF;

      -- Tự động publish shop nếu có shop_id
      IF NEW.shop_id IS NOT NULL THEN
        UPDATE public.shops SET is_published = true WHERE id = NEW.shop_id;
      END IF;
    END IF;
    RETURN NEW;
  END;
  $$;
