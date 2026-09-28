-- Thêm cột membership_until vào profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS membership_until timestamp with time zone;
