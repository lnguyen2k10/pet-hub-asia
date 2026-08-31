CREATE TABLE public.partner_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  company_name text not null,
  logo_url text,
  cover_url text,
  listing_type text not null default 'tim_dai_ly',
  title text not null,
  summary text,
  description text,
  category text,
  city text,
  investment_note text,
  contact_name text,
  contact_phone text,
  contact_email text,
  website text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT ON public.partner_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_listings TO authenticated;
GRANT ALL ON public.partner_listings TO service_role;

ALTER TABLE public.partner_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published listings" ON public.partner_listings
  FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Owners manage own listings" ON public.partner_listings
  FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_partner_listings_updated_at BEFORE UPDATE ON public.partner_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.partner_listings (company_name, listing_type, title, summary, description, category, city, investment_note, contact_name, contact_phone, contact_email, is_featured) VALUES
('Công ty TNHH PetFood Việt', 'tim_dai_ly', 'Tìm đại lý phân phối thức ăn hạt cao cấp cho chó mèo', 'Chiết khấu tới 35%, hỗ trợ trưng bày và marketing tại điểm bán.', 'PetFood Việt là nhà nhập khẩu chính hãng các dòng hạt cao cấp cho chó mèo. Chúng tôi tìm đại lý cấp 1 tại 63 tỉnh thành: hỗ trợ giá sỉ, kệ trưng bày, tài liệu bán hàng và chương trình khuyến mãi hằng tháng.', 'thuc-an', 'TP. Hồ Chí Minh', 'Vốn nhập hàng từ 30 triệu', 'Chị Ngọc', '0901 234 567', 'sales@petfoodviet.vn', true),
('Meow Care Group', 'tim_nha_phan_phoi', 'Tuyển nhà phân phối khu vực miền Bắc – dòng cát vệ sinh & phụ kiện', 'Độc quyền khu vực, giao hàng tận nơi, công nợ 30 ngày.', 'Meow Care Group sản xuất cát vệ sinh đậu nành và phụ kiện cho mèo. Cần nhà phân phối độc quyền theo tỉnh khu vực miền Bắc, cam kết bảo vệ giá và hỗ trợ đội ngũ sales thị trường.', 'phu-kien', 'Hà Nội', 'Doanh số cam kết 100 triệu/tháng', 'Anh Tuấn', '0987 654 321', 'partner@meowcare.vn', true),
('Chuỗi Spa Thú Cưng HappyPaw', 'nhuong_quyen', 'Nhượng quyền spa & grooming thú cưng HappyPaw', 'Trọn gói setup 6-8 tuần, đào tạo groomer, thương hiệu đã có 24 chi nhánh.', 'HappyPaw chuyển giao mô hình spa – grooming – khách sạn thú cưng: thiết kế cửa hàng, quy trình vận hành, phần mềm quản lý và đào tạo nhân sự. Phù hợp mặt bằng từ 60m2.', 'spa', 'Đà Nẵng', 'Đầu tư từ 350 triệu', 'Anh Khoa', '0912 888 777', 'franchise@happypaw.vn', true),
('VetPro Medical', 'tim_doi_tac', 'Tìm đối tác hợp tác cung cấp thiết bị & thuốc thú y', 'Hợp tác cùng phòng khám, bệnh viện thú y trên toàn quốc.', 'VetPro Medical cung cấp thiết bị xét nghiệm, máy siêu âm và dược phẩm thú y nhập khẩu. Chúng tôi tìm đối tác phòng khám để hợp tác dài hạn, hỗ trợ trả góp thiết bị và bảo hành tận nơi.', 'thu-y', 'Toàn quốc', 'Linh hoạt theo hợp đồng', 'Chị Hà', '0933 456 789', 'hop.tac@vetpro.vn', false);