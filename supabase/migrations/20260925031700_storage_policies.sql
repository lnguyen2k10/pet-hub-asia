-- Enable storage.objects policies for shop-media bucket

-- Allow public to view (select) objects from shop-media bucket
CREATE POLICY "Public Access shop-media"
ON storage.objects FOR SELECT
USING ( bucket_id = 'shop-media' );

-- Allow authenticated users to upload objects to shop-media bucket
CREATE POLICY "Auth Insert shop-media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'shop-media'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own objects or any object if needed
CREATE POLICY "Auth Update shop-media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'shop-media'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete objects
CREATE POLICY "Auth Delete shop-media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'shop-media'
  AND auth.role() = 'authenticated'
);
