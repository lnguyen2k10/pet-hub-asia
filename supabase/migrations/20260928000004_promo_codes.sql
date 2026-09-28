-- Bảng lưu trữ mã quà tặng (Promo Codes)
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  description text,
  quota_deals integer DEFAULT 0,
  quota_products integer DEFAULT 0,
  quota_featured_slots integer DEFAULT 0,
  quota_partner_posts integer DEFAULT 0,
  quota_blog_posts integer DEFAULT 0,
  max_uses integer DEFAULT 1,
  uses_count integer DEFAULT 0,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Bảng lưu lịch sử sử dụng mã (Tránh 1 người dùng 1 mã nhiều lần)
CREATE TABLE IF NOT EXISTS public.promo_code_uses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code_id uuid REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at timestamp with time zone DEFAULT now(),
  UNIQUE(code_id, user_id)
);

-- Bật RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_uses ENABLE ROW LEVEL SECURITY;

-- Policy cho admin (Full access)
CREATE POLICY "Admin full access promo_codes" ON public.promo_codes FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access promo_code_uses" ON public.promo_code_uses FOR ALL USING (public.is_admin());

-- Người dùng có thể xem mã (để RPC kiểm tra, nhưng RPC thường bypass RLS nếu định nghĩa SECURITY DEFINER)
-- Tốt nhất không cần policy SELECT cho user vì ta dùng RPC SECURITY DEFINER.
-- Người dùng có thể xem lịch sử dùng mã của chính mình
CREATE POLICY "User see own uses" ON public.promo_code_uses FOR SELECT USING (auth.uid() = user_id);


-- Hàm RPC để user đổi mã
CREATE OR REPLACE FUNCTION public.redeem_promo_code(p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_promo record;
BEGIN
  -- Lấy user đang đăng nhập
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vui lòng đăng nhập để sử dụng mã.';
  END IF;

  -- Tìm mã
  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE code = UPPER(p_code);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mã quà tặng không tồn tại hoặc đã bị xóa.';
  END IF;

  -- Kiểm tra hạn
  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < now() THEN
    RAISE EXCEPTION 'Mã quà tặng đã hết hạn sử dụng.';
  END IF;

  -- Kiểm tra số lượt
  IF v_promo.uses_count >= v_promo.max_uses THEN
    RAISE EXCEPTION 'Mã quà tặng đã hết lượt sử dụng.';
  END IF;

  -- Kiểm tra xem user đã dùng chưa
  IF EXISTS (SELECT 1 FROM public.promo_code_uses WHERE code_id = v_promo.id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'Bạn đã sử dụng mã quà tặng này rồi.';
  END IF;

  -- Ghi nhận sử dụng
  INSERT INTO public.promo_code_uses (code_id, user_id) VALUES (v_promo.id, v_user_id);

  -- Tăng số lượt dùng
  UPDATE public.promo_codes
  SET uses_count = uses_count + 1
  WHERE id = v_promo.id;

  -- Cộng Quota
  UPDATE public.profiles
  SET 
    quota_deals = COALESCE(quota_deals, 0) + v_promo.quota_deals,
    quota_products = CASE 
      WHEN COALESCE(quota_products, 0) = -1 OR v_promo.quota_products = -1 THEN -1 
      ELSE COALESCE(quota_products, 0) + v_promo.quota_products 
    END,
    quota_featured_slots = COALESCE(quota_featured_slots, 0) + v_promo.quota_featured_slots,
    quota_partner_posts = COALESCE(quota_partner_posts, 0) + v_promo.quota_partner_posts,
    quota_blog_posts = COALESCE(quota_blog_posts, 0) + v_promo.quota_blog_posts
  WHERE id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Sử dụng mã thành công!',
    'promo', row_to_json(v_promo)
  );
END;
$$;
