-- SQL script to set up storage policies for product-images bucket
-- Run this in your Supabase dashboard SQL Editor

-- Drop existing policies if they exist (ignore errors if they don't exist)
DROP POLICY IF EXISTS "product-images_public_select" ON storage.objects;
DROP POLICY IF EXISTS "product-images_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "product-images_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "product-images_owner_delete" ON storage.objects;

-- Create policies for product-images bucket
-- Public read access (anyone can view product images)
CREATE POLICY "product-images_public_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Authenticated insert access (authenticated users can upload product images)
CREATE POLICY "product-images_auth_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Owner update access (users can update their own uploads)
CREATE POLICY "product-images_owner_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND auth.uid() = owner
);

-- Owner delete access (users can delete their own uploads)
CREATE POLICY "product-images_owner_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.uid() = owner
);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE 'product-images%'; 