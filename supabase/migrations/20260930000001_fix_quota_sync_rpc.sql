-- =============================================================================
-- Migration: Fix quota sync for approved membership requests
-- Date: 2026-09-30
-- Problem:
--   1. Goi duoc admin tao moi khong co max_deals/max_products set -> quota = 0
--   2. Trigger process_approved_membership chay nhung cong 0 vao profile
-- Fix:
--   1. Them RPC sync_my_membership_quota() cho phep user tu sync quota
--   2. Them cot quota_synced_at de track da sync chua
-- =============================================================================

-- Them cot de track request da duoc sync quota chua
ALTER TABLE public.membership_requests
  ADD COLUMN IF NOT EXISTS quota_synced_at timestamptz DEFAULT NULL;

-- RPC: user tu sync quota tu approved requests chua duoc sync
CREATE OR REPLACE FUNCTION public.sync_my_membership_quota()
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $func$
DECLARE
  v_user_id uuid;
  req_row   record;
  plan_row  record;
  v_count   integer := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION ''Not authenticated'';
  END IF;

  FOR req_row IN
    SELECT mr.*
    FROM public.membership_requests mr
    WHERE mr.user_id = v_user_id
      AND mr.status  = ''approved''
      AND mr.plan_id IS NOT NULL
      AND mr.quota_synced_at IS NULL
    ORDER BY mr.created_at ASC
  LOOP
    SELECT * INTO plan_row FROM public.membership_plans WHERE id = req_row.plan_id;
    IF FOUND THEN
      UPDATE public.profiles
      SET
        quota_deals          = COALESCE(quota_deals, 0)          + COALESCE(plan_row.max_deals, 0),
        quota_products       = CASE
                                 WHEN COALESCE(quota_products, 0) = -1
                                   OR COALESCE(plan_row.max_products, 0) = -1
                                 THEN -1
                                 ELSE COALESCE(quota_products, 0) + COALESCE(plan_row.max_products, 0)
                               END,
        quota_featured_slots = COALESCE(quota_featured_slots, 0) + COALESCE(plan_row.featured_slots, 0),
        quota_partner_posts  = COALESCE(quota_partner_posts, 0)  + COALESCE(plan_row.max_partner_posts, 0),
        quota_blog_posts     = COALESCE(quota_blog_posts, 0)     + COALESCE(plan_row.max_blog_posts, 0),
        membership_until     = GREATEST(
                                 COALESCE(membership_until, now()),
                                 COALESCE(req_row.expires_at, now())
                               )
      WHERE id = v_user_id;

      UPDATE public.membership_requests
      SET quota_synced_at = now()
      WHERE id = req_row.id;

      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    ''synced'', v_count,
    ''message'', CASE v_count
      WHEN 0 THEN ''Khong co goi moi can dong bo.''
      ELSE v_count || '' goi da duoc dong bo quota thanh cong.''
    END
  );
END;
$func$;

GRANT EXECUTE ON FUNCTION public.sync_my_membership_quota() TO authenticated;
