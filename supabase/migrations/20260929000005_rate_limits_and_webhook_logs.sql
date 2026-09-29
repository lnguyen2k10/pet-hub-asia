-- =============================================================================
-- Migration: Webhook Idempotency & Rate Limit Tables
-- Date: 2026-09-29
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.sepay_webhooks_log (
    id TEXT PRIMARY KEY,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount NUMERIC,
    content TEXT
);

CREATE TABLE IF NOT EXISTS public.contact_rate_limits (
    ip TEXT PRIMARY KEY,
    request_count INT DEFAULT 1,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Allow anonymous and authenticated users to access these via service role only
-- So we can safely leave RLS enabled but with no policies (deny all for public)
ALTER TABLE public.sepay_webhooks_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;
