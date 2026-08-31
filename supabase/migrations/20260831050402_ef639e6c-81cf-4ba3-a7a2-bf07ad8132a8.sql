CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  price numeric,
  currency text NOT NULL DEFAULT 'VND',
  image_url text,
  in_stock boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_public_read ON public.products
FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = products.shop_id AND s.is_published = true));

CREATE POLICY products_owner_all ON public.products
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = products.shop_id AND s.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = products.shop_id AND s.owner_id = auth.uid()));

CREATE INDEX products_shop_id_idx ON public.products(shop_id);

CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();