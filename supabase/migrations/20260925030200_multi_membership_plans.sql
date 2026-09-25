-- ============================================================
-- Multi-tier membership plans system
-- ============================================================

-- Bảng gói thành viên (admin tạo nhiều gói)
CREATE TABLE IF NOT EXISTS public.membership_plans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,                           -- Tên gói: "Cơ bản", "Nâng cao", "Doanh nghiệp"
  description   text,                                   -- Mô tả gói
  price_amount  numeric(12,0) NOT NULL DEFAULT 299000,  -- Giá gói (VND)
  currency      text NOT NULL DEFAULT 'VND',
  duration_days integer NOT NULL DEFAULT 365,            -- Thời hạn (ngày), 365 = 1 năm
  period_label  text NOT NULL DEFAULT 'năm',             -- Nhãn hiển thị: "năm", "tháng", "3 tháng"
  features      text[] DEFAULT '{}',                    -- Danh sách tính năng (mảng)
  is_active     boolean NOT NULL DEFAULT true,           -- Có đang bán không
  is_featured   boolean NOT NULL DEFAULT false,          -- Gói nổi bật (highlight)
  sort_order    integer NOT NULL DEFAULT 0,              -- Thứ tự hiển thị
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

-- Mọi người đều đọc được gói đang active
CREATE POLICY "Anyone can read active plans"
  ON public.membership_plans FOR SELECT
  USING (is_active = true);

-- Admin đọc tất cả
CREATE POLICY "Admins read all plans"
  ON public.membership_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Admin mới được tạo/sửa/xóa
CREATE POLICY "Admins manage plans"
  ON public.membership_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Thêm cột plan_id vào membership_requests để liên kết gói
ALTER TABLE public.membership_requests
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.membership_plans(id) ON DELETE SET NULL;

-- Index để tìm kiếm nhanh theo plan
CREATE INDEX IF NOT EXISTS idx_membership_requests_plan_id ON public.membership_requests(plan_id);

-- Trigger tự động update updated_at
CREATE OR REPLACE FUNCTION public.update_membership_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS membership_plans_updated_at ON public.membership_plans;
CREATE TRIGGER membership_plans_updated_at
  BEFORE UPDATE ON public.membership_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_membership_plans_updated_at();

-- Seed: Tạo 3 gói mặc định nếu chưa có gói nào
INSERT INTO public.membership_plans (name, description, price_amount, duration_days, period_label, features, is_featured, sort_order)
SELECT * FROM (VALUES
  (
    'Gói Cơ Bản',
    'Dành cho shop mới bắt đầu kinh doanh pet',
    199000::numeric,
    180,
    '6 tháng',
    ARRAY['Landing page shop', 'Hiển thị trên danh sách shops', 'Hỗ trợ cơ bản'],
    false,
    1
  ),
  (
    'Gói Tiêu Chuẩn',
    'Phù hợp với shop đang phát triển, nhiều tính năng hơn',
    299000::numeric,
    365,
    'năm',
    ARRAY['Landing page shop', 'Hiển thị nổi bật', 'Đăng tối đa 20 sản phẩm', 'Huy hiệu xác minh', 'Hỗ trợ ưu tiên'],
    true,
    2
  ),
  (
    'Gói Doanh Nghiệp',
    'Giải pháp toàn diện cho chuỗi pet shop, nhiều chi nhánh',
    599000::numeric,
    365,
    'năm',
    ARRAY['Tất cả tính năng Tiêu Chuẩn', 'Quản lý nhiều chi nhánh', 'Báo cáo thống kê', 'API tích hợp', 'Account manager riêng'],
    false,
    3
  )
) AS v(name, description, price_amount, duration_days, period_label, features, is_featured, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.membership_plans LIMIT 1);
