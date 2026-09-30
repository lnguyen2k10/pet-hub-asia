-- Thêm cột views_count vào bảng shops nếu chưa có
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Tạo function tăng lượt xem ngẫu nhiên (từ 5 đến 20) cho tất cả các shop
CREATE OR REPLACE FUNCTION public.add_random_shop_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Cập nhật views_count cho các shop đang hiển thị (is_published = true)
  UPDATE public.shops
  SET views_count = COALESCE(views_count, 0) + floor(random() * 16 + 5)::int
  WHERE is_published = true;
END;
$$;

-- Bật extension pg_cron (yêu cầu quyền superuser, Supabase postgres role đã có sẵn)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Hủy job cũ nếu có để tránh tạo trùng
DO $$
BEGIN
  PERFORM cron.unschedule('daily_random_shop_views');
EXCEPTION WHEN OTHERS THEN
  -- Bỏ qua nếu job chưa tồn tại
END $$;

-- Lên lịch chạy job vào lúc 00:00 mỗi ngày
SELECT cron.schedule(
  'daily_random_shop_views', -- Tên công việc
  '0 0 * * *',               -- Cron expression: Chạy lúc 0h00 mỗi ngày
  'SELECT public.add_random_shop_views()'
);
