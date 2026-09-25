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

-- Clean existing plans
TRUNCATE TABLE public.membership_plans CASCADE;

-- Insert new plans
INSERT INTO public.membership_plans (
  name, description, price_amount, duration_days, period_label, features, is_featured, sort_order,
  max_deals, max_products, featured_slots, max_partner_posts, max_blog_posts
) VALUES
('Gói Premium', '1 Trang Landingpage chính thức, đăng 1 ưu đãi, Đăng 20 sản phẩm, 1 lần xuất hiển trong danh sách nổi bật trong 7 ngày', 299000, 365, 'năm', ARRAY['1 Trang Landingpage', '1 Ưu đãi', '20 Sản phẩm', '1 lần xuất hiện nổi bật (7 ngày)'], false, 1, 1, 20, 1, 0, 0),
('Gói VIP', '1 Trang Landingpage chính thức, đăng 3 ưu đãi, Đăng không giới hạn sản phẩm, 3 lần xuất hiển trong danh sách nổi bật trong 7 ngày', 399000, 365, 'năm', ARRAY['1 Trang Landingpage', '3 Ưu đãi (có thể chỉnh sửa)', 'Không giới hạn sản phẩm', '3 lần xuất hiện nổi bật (7 ngày)'], true, 2, 3, -1, 3, 0, 0),
('Gói hợp tác kinh doanh', 'Đăng 1 tin hợp tác kinh doanh hiệu lực trong 1 năm, có thể chỉnh sửa nội dung không giới hạn', 100000, 365, 'năm', ARRAY['1 tin hợp tác kinh doanh', 'Chỉnh sửa không giới hạn'], false, 3, 0, 0, 0, 1, 0),
('Quà tặng (Đăng ký sớm)', 'Tặng 1 bài đăng Blog. Áp dụng cho khách hàng đăng ký sớm.', 0, 3650, 'không giới hạn', ARRAY['1 bài đăng Blog', 'Miễn phí cho khách đăng ký sớm'], false, 4, 0, 0, 0, 0, 1);

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
$;

DROP TRIGGER IF EXISTS on_membership_request_approved_insert ON public.membership_requests;
CREATE TRIGGER on_membership_request_approved_insert
AFTER INSERT ON public.membership_requests
FOR EACH ROW EXECUTE FUNCTION public.process_approved_membership();

DROP TRIGGER IF EXISTS on_membership_request_approved_update ON public.membership_requests;
CREATE TRIGGER on_membership_request_approved_update
AFTER UPDATE ON public.membership_requests
FOR EACH ROW EXECUTE FUNCTION public.process_approved_membership();


-- C?p nh?t trigger auto approve d? t? d?ng duy?t c�c don mi?n ph� (amount = 0)
CREATE OR REPLACE FUNCTION public.auto_approve_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
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
$func$;

