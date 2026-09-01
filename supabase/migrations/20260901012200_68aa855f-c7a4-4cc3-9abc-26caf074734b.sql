REVOKE SELECT ON public.partner_listings FROM anon;
GRANT SELECT (id, owner_id, company_name, logo_url, cover_url, listing_type, title, summary, description, category, city, investment_note, website, is_featured, is_published, created_at, updated_at) ON public.partner_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_listings TO authenticated;
GRANT ALL ON public.partner_listings TO service_role;