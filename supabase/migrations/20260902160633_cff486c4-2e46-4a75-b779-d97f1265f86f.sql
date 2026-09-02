REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.partner_listings FROM anon;
REVOKE SELECT ON public.partner_listings FROM anon;
GRANT SELECT (id, owner_id, company_name, logo_url, cover_url, listing_type, title, summary, description, category, city, investment_note, website, is_featured, is_published, created_at, updated_at) ON public.partner_listings TO anon;

DROP POLICY IF EXISTS shop_media_public_read ON storage.objects;
CREATE POLICY shop_media_owner_read ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'shop-media' AND (storage.foldername(name))[1] = auth.uid()::text);