-- Thêm các cột quota cho bảng membership_plans
ALTER TABLE public.membership_plans
ADD COLUMN IF NOT EXISTS max_deals integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_products integer DEFAULT 0, -- -1 for unlimited
ADD COLUMN IF NOT EXISTS featured_slots integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_partner_posts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_blog_posts integer DEFAULT 0;

-- Thêm các cột quota cho bảng profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS quota_deals integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS quota_products integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS quota_featured_slots integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS quota_partner_posts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS quota_blog_posts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_claimed_free_blog boolean DEFAULT false;

-- Clean existing plans is removed to prevent data loss on production
-- Instead of truncating, you should manually run UPDATE statements if you need to modify existing plans.

-- Function xử lý cộng dồn quota khi request được approve
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
      SET quota_deals = COALESCE(quota_deals, 0) + plan_rec.max_deals,
          quota_products = CASE 
            WHEN COALESCE(quota_products, 0) = -1 OR plan_rec.max_products = -1 THEN -1 
            ELSE COALESCE(quota_products, 0) + plan_rec.max_products 
          END,
          quota_featured_slots = COALESCE(quota_featured_slots, 0) + plan_rec.featured_slots,
          quota_partner_posts = COALESCE(quota_partner_posts, 0) + plan_rec.max_partner_posts,
          quota_blog_posts = COALESCE(quota_blog_posts, 0) + plan_rec.max_blog_posts
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_membership_request_approved_insert ON public.membership_requests;
CREATE TRIGGER on_membership_request_approved_insert
AFTER INSERT ON public.membership_requests
FOR EACH ROW EXECUTE FUNCTION public.process_approved_membership();

DROP TRIGGER IF EXISTS on_membership_request_approved_update ON public.membership_requests;
CREATE TRIGGER on_membership_request_approved_update
AFTER UPDATE ON public.membership_requests
FOR EACH ROW EXECUTE FUNCTION public.process_approved_membership();


-- Cập nhật trigger auto approve để tự động duyệt các đơn miễn phí (amount = 0)
CREATE OR REPLACE FUNCTION public.auto_approve_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.proof_url IS NOT NULL OR NEW.amount = 0) AND NEW.status = 'pending' THEN
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
