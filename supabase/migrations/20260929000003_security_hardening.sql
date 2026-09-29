-- =============================================================================
-- Migration: Security Hardening Round 2
-- Date: 2026-09-29
-- Fixes:
--   1. Storage policies: UPDATE/DELETE giới hạn theo folder = auth.uid()
--   2. shop_claims admin policy: thêm WITH CHECK
--   3. redeem_promo_code: FOR UPDATE lock + SET search_path
-- =============================================================================

-- ── 1. Storage: sửa UPDATE/DELETE chỉ cho phép owner ─────────────────────────
DROP POLICY IF EXISTS "Auth Update shop-media" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete shop-media" ON storage.objects;

CREATE POLICY "Owner Update shop-media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'shop-media'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Owner Delete shop-media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'shop-media'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ── 2. shop_claims: Thêm WITH CHECK cho admin policy ─────────────────────────
DROP POLICY IF EXISTS "Admins can do everything on shop_claims" ON public.shop_claims;
CREATE POLICY "Admins can do everything on shop_claims"
  ON public.shop_claims FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── 3. redeem_promo_code: FOR UPDATE lock + search_path ──────────────────────
CREATE OR REPLACE FUNCTION public.redeem_promo_code(p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_user_id uuid;
  v_promo record;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vui lòng đăng nhập để sử dụng mã.';
  END IF;

  -- Lock row để tránh race condition (concurrent requests)
  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE code = UPPER(p_code)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mã quà tặng không tồn tại hoặc đã bị xóa.';
  END IF;

  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < now() THEN
    RAISE EXCEPTION 'Mã quà tặng đã hết hạn sử dụng.';
  END IF;

  IF v_promo.uses_count >= v_promo.max_uses THEN
    RAISE EXCEPTION 'Mã quà tặng đã hết lượt sử dụng.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.promo_code_uses WHERE code_id = v_promo.id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'Bạn đã sử dụng mã quà tặng này rồi.';
  END IF;

  INSERT INTO public.promo_code_uses (code_id, user_id) VALUES (v_promo.id, v_user_id);

  UPDATE public.promo_codes
  SET uses_count = uses_count + 1
  WHERE id = v_promo.id;

  UPDATE public.profiles
  SET
    quota_deals          = COALESCE(quota_deals, 0) + v_promo.quota_deals,
    quota_products       = CASE WHEN COALESCE(quota_products,0)=-1 OR v_promo.quota_products=-1 THEN -1
                                ELSE COALESCE(quota_products,0)+v_promo.quota_products END,
    quota_featured_slots = COALESCE(quota_featured_slots,0) + v_promo.quota_featured_slots,
    quota_partner_posts  = COALESCE(quota_partner_posts,0)  + v_promo.quota_partner_posts,
    quota_blog_posts     = COALESCE(quota_blog_posts,0)     + v_promo.quota_blog_posts
  WHERE id = v_user_id;

  RETURN json_build_object('success', true, 'message', 'Sử dụng mã thành công!', 'promo', row_to_json(v_promo));
END;
$func$;
