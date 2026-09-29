-- =============================================================================
-- Migration: DB Quota Triggers
-- Date: 2026-09-29
-- Enforce quotas at the database level for deals, products, and partner_listings
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_deal_quota()
RETURNS trigger AS $$
DECLARE
  v_quota int;
  v_count int;
  v_owner uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.shop_id = NEW.shop_id THEN
    RETURN NEW;
  END IF;
  SELECT owner_id INTO v_owner FROM public.shops WHERE id = NEW.shop_id;
  SELECT quota_deals INTO v_quota FROM public.profiles WHERE id = v_owner FOR UPDATE;
  IF v_quota IS NOT NULL AND v_quota <> -1 THEN
    SELECT COUNT(*) INTO v_count FROM public.deals WHERE shop_id = NEW.shop_id;
    IF v_count >= v_quota THEN
      RAISE EXCEPTION 'Da het quota uu dai (toi da: %).', v_quota;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_deal_quota_insert ON public.deals;
CREATE TRIGGER enforce_deal_quota_insert BEFORE INSERT OR UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.check_deal_quota();

CREATE OR REPLACE FUNCTION public.check_product_quota()
RETURNS trigger AS $$
DECLARE
  v_quota int;
  v_count int;
  v_owner uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.shop_id = NEW.shop_id THEN
    RETURN NEW;
  END IF;
  SELECT owner_id INTO v_owner FROM public.shops WHERE id = NEW.shop_id;
  SELECT quota_products INTO v_quota FROM public.profiles WHERE id = v_owner FOR UPDATE;
  IF v_quota IS NOT NULL AND v_quota <> -1 THEN
    SELECT COUNT(*) INTO v_count FROM public.products WHERE shop_id = NEW.shop_id;
    IF v_count >= v_quota THEN
      RAISE EXCEPTION 'Da het quota san pham (toi da: %).', v_quota;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_product_quota_insert ON public.products;
CREATE TRIGGER enforce_product_quota_insert BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.check_product_quota();

CREATE OR REPLACE FUNCTION public.check_partner_listing_quota()
RETURNS trigger AS $$
DECLARE
  v_quota int;
  v_count int;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.owner_id = NEW.owner_id THEN
    RETURN NEW;
  END IF;
  SELECT quota_partner_posts INTO v_quota FROM public.profiles WHERE id = NEW.owner_id FOR UPDATE;
  IF v_quota IS NOT NULL AND v_quota <> -1 THEN
    SELECT COUNT(*) INTO v_count FROM public.partner_listings WHERE owner_id = NEW.owner_id;
    IF v_count >= v_quota THEN
      RAISE EXCEPTION 'Da het quota tin doi tac (toi da: %).', v_quota;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_partner_listing_quota_insert ON public.partner_listings;
CREATE TRIGGER enforce_partner_listing_quota_insert BEFORE INSERT OR UPDATE ON public.partner_listings FOR EACH ROW EXECUTE FUNCTION public.check_partner_listing_quota();
