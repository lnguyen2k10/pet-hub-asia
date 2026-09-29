-- =============================================================================
-- Migration: Atomic Rate Limiting RPC
-- Date: 2026-09-29
-- =============================================================================

CREATE OR REPLACE FUNCTION public.increment_contact_rate_limit(p_ip text)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO public.contact_rate_limits (ip, request_count, expires_at)
  VALUES (p_ip, 1, NOW() + interval '15 minutes')
  ON CONFLICT (ip) DO UPDATE
  SET 
    request_count = CASE 
      WHEN public.contact_rate_limits.expires_at < NOW() THEN 1 
      ELSE public.contact_rate_limits.request_count + 1 
    END,
    expires_at = CASE 
      WHEN public.contact_rate_limits.expires_at < NOW() THEN NOW() + interval '15 minutes' 
      ELSE public.contact_rate_limits.expires_at 
    END
  RETURNING request_count INTO v_count;

  RETURN v_count;
END;
$$;
