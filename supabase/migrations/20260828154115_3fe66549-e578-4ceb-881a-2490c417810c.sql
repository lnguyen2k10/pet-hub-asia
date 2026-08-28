CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'pet-shop',
  city TEXT NOT NULL DEFAULT 'TP.HCM',
  address TEXT,
  phone TEXT,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
  review_count INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shops TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shops TO authenticated;
GRANT ALL ON public.shops TO service_role;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shops_public_read" ON public.shops FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "shops_owner_read" ON public.shops FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "shops_owner_insert" ON public.shops FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "shops_owner_update" ON public.shops FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "shops_owner_delete" ON public.shops FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  discount_label TEXT,
  image_url TEXT,
  ends_at DATE,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.deals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deals_public_read" ON public.deals FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = deals.shop_id AND s.is_published = true));
CREATE POLICY "deals_owner_all" ON public.deals FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = deals.shop_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = deals.shop_id AND s.owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER shops_set_updated_at BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER deals_set_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.shops (slug, name, category, city, address, phone, description, hero_title, hero_subtitle, rating, review_count, is_featured) VALUES
('cho-meo-city', 'Chó Mèo City', 'pet-shop', 'Hà Nội', '12 Trần Duy Hưng, Cầu Giấy', '0901 234 567', 'Cửa hàng đồ dùng, thức ăn và phụ kiện cho chó mèo với hơn 500 sản phẩm chính hãng.', 'Mọi thứ bé cưng cần, trong một cửa hàng', 'Thức ăn, phụ kiện, đồ chơi chính hãng — giao nhanh trong 2 giờ tại Hà Nội.', 4.9, 218, true),
('meo-miu-spa', 'Mèo Miu Spa', 'grooming', 'TP.HCM', '45 Nguyễn Đình Chiểu, Quận 3', '0902 345 678', 'Spa & grooming chuyên biệt cho mèo, không gian yên tĩnh, kỹ thuật viên nhẹ nhàng.', 'Spa dịu dàng dành riêng cho các bé mèo', 'Tắm, cắt tỉa, chăm sóc lông — đặt lịch online chỉ trong 30 giây.', 4.8, 162, true),
('thu-y-sai-gon', 'Thú Y Sài Gòn', 'clinic', 'TP.HCM', '88 Cách Mạng Tháng 8, Quận 10', '0903 456 789', 'Phòng khám thú y với bác sĩ nhiều năm kinh nghiệm, trang thiết bị hiện đại.', 'Chăm sóc sức khoẻ bé cưng 24/7', 'Khám tổng quát, tiêm phòng, phẫu thuật — luôn có bác sĩ trực.', 5.0, 97, true),
('pawsome-kitchen', 'Pawsome Kitchen', 'food', 'Hà Nội', '7 Xuân Diệu, Tây Hồ', '0904 567 890', 'Bếp nấu thức ăn tươi handmade cho chó mèo theo công thức dinh dưỡng riêng.', 'Bữa ăn tươi mỗi ngày cho bé cưng', 'Nguyên liệu tươi, không chất bảo quản, giao tận nhà theo tuần.', 4.7, 143, true),
('happy-tails-danang', 'Happy Tails Đà Nẵng', 'clinic', 'Đà Nẵng', '21 Nguyễn Văn Linh, Hải Châu', '0905 678 901', 'Phòng khám và khách sạn thú cưng tại trung tâm Đà Nẵng.', 'Phòng khám & khách sạn thú cưng Đà Nẵng', 'Khám bệnh, lưu trú, chăm sóc trọn gói cho chó mèo.', 4.6, 76, true),
('pet-house-can-tho', 'Pet House Cần Thơ', 'accessory', 'Cần Thơ', '3 Đường 30/4, Ninh Kiều', '0906 789 012', 'Chuyên phụ kiện thời trang, dây dắt, chuồng và đồ chơi cho chó mèo.', 'Phụ kiện xinh cho bé cưng miền Tây', 'Dây dắt, quần áo, chuồng nệm — mẫu mới mỗi tuần.', 4.5, 54, false);

INSERT INTO public.deals (shop_id, title, description, discount_label, ends_at, is_featured)
SELECT s.id, d.title, d.description, d.discount_label, d.ends_at, true
FROM (VALUES
  ('cho-meo-city', 'Gói đồ ăn cao cấp tháng', 'Áp dụng cho đơn hàng đầu tiên', '-30%', DATE '2026-12-31'),
  ('meo-miu-spa', 'Gội spa premium cho mèo', 'Giới hạn 50 suất · Đặt trước', '-40%', DATE '2026-12-31'),
  ('thu-y-sai-gon', 'Khám & tiêm phòng trọn gói', 'Bé dưới 6 tháng · Tuần lễ miễn phí', 'Miễn phí', DATE '2026-12-31'),
  ('pawsome-kitchen', 'Combo 7 ngày ăn tươi', 'Tặng thêm 1 phần ăn cuối tuần', '-25%', DATE '2026-12-31'),
  ('happy-tails-danang', 'Lưu trú 3 đêm tính 2', 'Áp dụng ngày thường', 'Mua 2 tặng 1', DATE '2026-12-31'),
  ('pet-house-can-tho', 'Dây dắt & vòng cổ', 'Bộ đôi phối màu mới', '-20%', DATE '2026-12-31')
) AS d(slug, title, description, discount_label, ends_at)
JOIN public.shops s ON s.slug = d.slug;