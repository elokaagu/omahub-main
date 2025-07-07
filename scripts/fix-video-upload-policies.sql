-- Fix video upload storage policies for spotlight-videos and product-videos buckets
-- Run this in your Supabase Dashboard > SQL Editor

-- === SPOTLIGHT-VIDEOS BUCKET POLICIES ===

-- Drop existing policies for spotlight-videos
DROP POLICY IF EXISTS "spotlight-videos_public_select" ON storage.objects;
DROP POLICY IF EXISTS "spotlight-videos_super_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "spotlight-videos_super_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "spotlight-videos_super_admin_delete" ON storage.objects;

-- Create comprehensive policies for spotlight-videos bucket

-- Public read access (anyone can view spotlight videos)
CREATE POLICY "spotlight-videos_public_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'spotlight-videos');

-- Super admin insert access (only super admins can upload spotlight videos)
CREATE POLICY "spotlight-videos_super_admin_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'spotlight-videos' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text = 'super_admin'
  )
);

-- Super admin update access (only super admins can update spotlight videos)
CREATE POLICY "spotlight-videos_super_admin_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'spotlight-videos'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text = 'super_admin'
  )
);

-- Super admin delete access (only super admins can delete spotlight videos)
CREATE POLICY "spotlight-videos_super_admin_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'spotlight-videos'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text = 'super_admin'
  )
);

-- === PRODUCT-VIDEOS BUCKET POLICIES ===

-- Drop existing policies for product-videos
DROP POLICY IF EXISTS "product-videos_public_select" ON storage.objects;
DROP POLICY IF EXISTS "product-videos_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "product-videos_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "product-videos_auth_delete" ON storage.objects;

-- Create comprehensive policies for product-videos bucket

-- Public read access (anyone can view product videos)
CREATE POLICY "product-videos_public_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-videos');

-- Authorized users can upload product videos (super_admin, admin, brand_admin)
CREATE POLICY "product-videos_auth_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-videos' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text IN ('super_admin', 'admin', 'brand_admin')
  )
);

-- Authorized users can update product videos
CREATE POLICY "product-videos_auth_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-videos'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text IN ('super_admin', 'admin', 'brand_admin')
  )
);

-- Authorized users can delete product videos
CREATE POLICY "product-videos_auth_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-videos'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text IN ('super_admin', 'admin', 'brand_admin')
  )
);

-- === VERIFICATION QUERIES ===

-- Verify spotlight-videos policies were created
SELECT 
  policyname, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage' 
  AND policyname LIKE '%spotlight-videos%'
ORDER BY policyname;

-- Verify product-videos policies were created
SELECT 
  policyname, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage' 
  AND policyname LIKE '%product-videos%'
ORDER BY policyname;

-- Check current user's role (run this when logged in to test)
SELECT 
  id,
  email,
  role,
  created_at
FROM profiles 
WHERE id = auth.uid(); 