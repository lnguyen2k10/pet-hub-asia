-- =============================================================================
-- Migration: Trial Feature + Admin Create User
-- Date: 2026-09-29
-- Purpose:
--   1. Thêm cột trial_ends_at vào bảng shops
--   2. RLS: Allow admin to set trial_ends_at via service role (bypass RLS)
-- =============================================================================

-- 1. Thêm cột trial_ends_at vào shops (đã chạy thực tế)
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT NULL;

-- 2. Comment mô tả
COMMENT ON COLUMN public.shops.trial_ends_at IS
  'Ngày hết hạn dùng thử (trial 30 ngày). NULL = không dùng thử. Admin set qua /api/admin/create-user hoặc toggle trong AdminShops.';
