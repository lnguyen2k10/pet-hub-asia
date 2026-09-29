-- =============================================================================
-- Migration: Fix Security & Sync Database
-- Date: 2026-09-29
-- Purpose:
--   1. DROP trigger auto_approve cũ (lỗ hổng: tự duyệt khi có proof_url hoặc amount=0)
--   2. Fix process_approved_membership — dùng tên cột ĐÚNG của DB thực (max_deals, etc.)
--   3. Fix type mismatch: starts_at/expires_at từ date → timestamptz
--   4. Thêm FK plan_id → membership_plans
--   5. Fix RLS policy membership_requests_insert_own: ràng buộc shop_id thuộc user
--   6. Thêm trigger validate shop owner không thể tự set is_featured/rating
--   7. Fix default is_published = false cho shops mới
-- =============================================================================

-- ─── 1. DROP trigger auto_approve cũ (LỖ HỔNG BẢO MẬT) ─────────────────────
DROP TRIGGER IF EXISTS membership_auto_approve ON public.membership_requests;
-- Giữ function auto_approve_membership nhưng vô hiệu hóa trigger
-- (không drop function để tránh lỗi nếu còn reference)

-- ─── 2. Fix process_approved_membership — tên cột đúng ───────────────────────
-- DB thực có: max_deals, max_products, featured_slots, max_partner_posts, max_blog_posts
-- và profiles có: quota_deals, quota_products, quota_featured_slots, quota_partner_posts, quota_blog_posts
CREATE OR REPLACE FUNCTION public.process_approved_membership()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  DECLARE
    plan_rec record;
  BEGIN
    -- Chỉ xử lý khi status chuyển sang 'approved' lần đầu
    IF NEW.status = 'approved'
       AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'approved')
       AND NEW.plan_id IS NOT NULL
    THEN
      SELECT * INTO plan_rec FROM public.membership_plans WHERE id = NEW.plan_id;

      IF FOUND THEN
        -- Cộng quota vào profile (tên cột đúng: max_deals, max_products, etc.)
        UPDATE public.profiles
        SET
          quota_deals          = COALESCE(quota_deals, 0)          + COALESCE(plan_rec.max_deals, 0),
          quota_products       = CASE
                                   WHEN COALESCE(quota_products, 0) = -1
                                     OR COALESCE(plan_rec.max_products, 0) = -1
                                   THEN -1
                                   ELSE COALESCE(quota_products, 0) + COALESCE(plan_rec.max_products, 0)
                                 END,
          quota_featured_slots = COALESCE(quota_featured_slots, 0) + COALESCE(plan_rec.featured_slots, 0),
          quota_partner_posts  = COALESCE(quota_partner_posts, 0)  + COALESCE(plan_rec.max_partner_posts, 0),
          quota_blog_posts     = COALESCE(quota_blog_posts, 0)     + COALESCE(plan_rec.max_blog_posts, 0),
          membership_until     = GREATEST(
                                   COALESCE(membership_until, now()),
                                   now() + (plan_rec.duration_days || ' days')::interval
                                 )
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

-- Đảm bảo trigger gắn đúng
DROP TRIGGER IF EXISTS on_membership_request_approved_insert ON public.membership_requests;
DROP TRIGGER IF EXISTS on_membership_request_approved_update ON public.membership_requests;

CREATE TRIGGER on_membership_request_approved_insert
  AFTER INSERT ON public.membership_requests
  FOR EACH ROW EXECUTE FUNCTION public.process_approved_membership();

CREATE TRIGGER on_membership_request_approved_update
  AFTER UPDATE ON public.membership_requests
  FOR EACH ROW EXECUTE FUNCTION public.process_approved_membership();

-- ─── 3. Fix type: starts_at / expires_at từ date → timestamptz ───────────────
-- server.ts ghi ISO string (timestamp), DB là date → tự động cast nhưng mất time zone info
-- Đổi sang timestamptz để khớp với server.ts và kich-hoat.tsx
ALTER TABLE public.membership_requests
  ALTER COLUMN starts_at TYPE timestamptz USING starts_at::timestamptz,
  ALTER COLUMN expires_at TYPE timestamptz USING expires_at::timestamptz;

-- ─── 4. Thêm FK plan_id → membership_plans (nếu chưa có) ─────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'membership_requests_plan_id_fkey'
      AND table_name = 'membership_requests'
  ) THEN
    ALTER TABLE public.membership_requests
      ADD CONSTRAINT membership_requests_plan_id_fkey
      FOREIGN KEY (plan_id) REFERENCES public.membership_plans(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── 5. Fix RLS: membership_requests INSERT — ràng buộc shop_id thuộc user ────
DROP POLICY IF EXISTS membership_requests_insert_own ON public.membership_requests;
CREATE POLICY membership_requests_insert_own
  ON public.membership_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND (
      shop_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.shops
        WHERE id = shop_id AND owner_id = auth.uid()
      )
    )
  );

-- ─── 6. Trigger validate: Owner không thể tự đặt is_featured hoặc sửa rating ──
CREATE OR REPLACE FUNCTION public.validate_shop_owner_update()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  BEGIN
    -- Chỉ admin mới được thay đổi is_featured và rating
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.is_featured   := OLD.is_featured;
      NEW.rating        := OLD.rating;
      NEW.review_count  := OLD.review_count;
    END IF;
    RETURN NEW;
  END;
  $$;

DROP TRIGGER IF EXISTS tr_validate_shop_owner_update ON public.shops;
CREATE TRIGGER tr_validate_shop_owner_update
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.validate_shop_owner_update();

-- ─── 7. Default is_published = false cho shops mới ───────────────────────────
ALTER TABLE public.shops
  ALTER COLUMN is_published SET DEFAULT false;

-- Ghi chú: shop hiện tại KHÔNG bị ảnh hưởng (chỉ thay default cho INSERT mới)
-- Các shop đã publish vẫn giữ nguyên.
