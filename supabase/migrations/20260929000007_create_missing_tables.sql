-- =============================================================================
-- Migration: Create missing tables if they don't exist
-- Date: 2026-09-29
-- =============================================================================

-- Table: contact_rate_limits
CREATE TABLE IF NOT EXISTS public.contact_rate_limits (
    ip text PRIMARY KEY,
    request_count int NOT NULL DEFAULT 1,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access" ON public.contact_rate_limits;
CREATE POLICY "Admin full access" ON public.contact_rate_limits FOR ALL USING (auth.role() = 'service_role');

-- Table: sepay_webhooks_log
CREATE TABLE IF NOT EXISTS public.sepay_webhooks_log (
    id text PRIMARY KEY,
    amount numeric,
    content text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.sepay_webhooks_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access" ON public.sepay_webhooks_log;
CREATE POLICY "Admin full access" ON public.sepay_webhooks_log FOR ALL USING (auth.role() = 'service_role');
