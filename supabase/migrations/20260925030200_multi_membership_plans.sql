-- ============================================================
-- Multi-tier membership plans system
-- Kiểm tra cấu trúc thực tế:
--   profiles: id, full_name, created_at, updated_at  (KHÔNG có is_admin)
--   Admin check qua bảng: user_roles(user_id, role='admin')
-- ============================================================

-- Bảng gói thành viên (admin tạo nhiều gói)
CREATE TABLE IF NOT EXISTS public.membership_plans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  description   text,
  price_amount  numeric(12,0) NOT NULL DEFAULT 299000,
  currency      text NOT NULL DEFAULT 'VND',
  duration_days integer NOT NULL DEFAULT 365,
  period_label  text NOT NULL DEFAULT 'năm',
  features      text[] DEFAULT '{}',
  is_active     boolean NOT NULL DEFAULT true,
  is_featured   boolean NOT NULL DEFAULT false,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

-- Mọi người đọc được gói đang active (không cần đăng nhập)
CREATE POLICY "Public can read active plans"
  ON public.membership_plans FOR SELECT
  USING (is_active = true);

-- Admin (có role='admin' trong user_roles) đọc tất cả gói (kể cả inactive)
CREATE POLICY "Admins read all plans"
  ON public.membership_plans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Admin tạo/sửa/xóa gói
CREATE POLICY "Admins insert plans"
  ON public.membership_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins update plans"
  ON public.membership_plans FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins delete plans"
  ON public.membership_plans FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Thêm cột plan_id vào membership_requests để liên kết gói
ALTER TABLE public.membership_requests
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.membership_plans(id) ON DELETE SET NULL;

-- Index để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_membership_requests_plan_id
  ON public.membership_requests(plan_id);

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

-- Seed 3 gói mặc định (chỉ khi bảng còn trống)
INSERT INTO public.membership_plans (name, description, price_amount, duration_days, period_label, features, is_featured, sort_order)
SELECT v.name, v.description, v.price_amount, v.duration_days, v.period_label, v.features, v.is_featured, v.sort_order
FROM (VALUES
  (
    'Gói Cơ Bản'::text,
    'Dành cho shop mới bắt đầu kinh doanh pet'::text,
    199000::numeric,
    180::integer,
    '6 tháng'::text,
    ARRAY['Landing page shop', 'Hiển thị trên danh sách shops', 'Hỗ trợ cơ bản']::text[],
    false::boolean,
    1::integer
  ),
  (
    'Gói Tiêu Chuẩn',
    'Phù hợp với shop đang phát triển, nhiều tính năng hơn',
    299000::numeric,
    365::integer,
    'năm'::text,
    ARRAY['Landing page shop', 'Hiển thị nổi bật', 'Đăng tối đa 20 sản phẩm', 'Huy hiệu xác minh', 'Hỗ trợ ưu tiên']::text[],
    true::boolean,
    2::integer
  ),
  (
    'Gói Doanh Nghiệp',
    'Giải pháp toàn diện cho chuỗi pet shop, nhiều chi nhánh',
    599000::numeric,
    365::integer,
    'năm'::text,
    ARRAY['Tất cả tính năng Tiêu Chuẩn', 'Quản lý nhiều chi nhánh', 'Báo cáo thống kê', 'API tích hợp', 'Account manager riêng']::text[],
    false::boolean,
    3::integer
  )
) AS v(name, description, price_amount, duration_days, period_label, features, is_featured, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.membership_plans LIMIT 1);
