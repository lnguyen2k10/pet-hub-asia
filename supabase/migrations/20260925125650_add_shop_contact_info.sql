-- Thêm các trường thông tin liên hệ cho shop
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS fanpage text;
