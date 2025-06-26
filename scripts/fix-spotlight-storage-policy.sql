-- Fix spotlight-images storage policy to allow appropriate users to upload
-- Run this in your Supabase Dashboard > SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "spotlight-images_super_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "spotlight-images_public_select" ON storage.objects;

-- Create more permissive policies for spotlight-images bucket

-- Public read access (anyone can view spotlight images)
CREATE POLICY "spotlight-images_public_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'spotlight-images');

-- Allow super_admin, admin, and brand_admin to upload spotlight images
CREATE POLICY "spotlight-images_admin_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'spotlight-images' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text IN ('super_admin', 'admin', 'brand_admin')
  )
);

-- Allow authorized users to update their spotlight images
CREATE POLICY "spotlight-images_admin_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'spotlight-images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text IN ('super_admin', 'admin', 'brand_admin')
  )
);

-- Allow authorized users to delete their spotlight images
CREATE POLICY "spotlight-images_admin_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'spotlight-images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text IN ('super_admin', 'admin', 'brand_admin')
  )
);

-- Verify policies were created
SELECT 
  policyname, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage' 
  AND policyname LIKE '%spotlight-images%'; 