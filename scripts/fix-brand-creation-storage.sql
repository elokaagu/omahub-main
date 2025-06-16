-- ========================================
-- COMPREHENSIVE FIX FOR BRAND CREATION STORAGE ISSUES
-- Copy and paste this entire script into your Supabase Dashboard > SQL Editor
-- ========================================

-- Step 1: Enable RLS on storage tables
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing storage policies to start fresh
DROP POLICY IF EXISTS "brand-assets_public_select" ON storage.objects;
DROP POLICY IF EXISTS "brand-assets_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "brand-assets_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "brand-assets_owner_delete" ON storage.objects;
DROP POLICY IF EXISTS "Public SELECT policy for brand-assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth INSERT policy for brand-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload brand images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to brand images" ON storage.objects;

-- Step 3: Create simple, permissive policies for brand-assets bucket
-- Public read access (anyone can view brand images)
CREATE POLICY "brand_assets_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'brand-assets');

-- Authenticated users can upload to brand-assets
CREATE POLICY "brand_assets_auth_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'brand-assets');

-- Authenticated users can update their uploads
CREATE POLICY "brand_assets_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'brand-assets' AND auth.uid() = owner);

-- Authenticated users can delete their uploads
CREATE POLICY "brand_assets_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'brand-assets' AND auth.uid() = owner);

-- Step 4: Create bucket policies
DROP POLICY IF EXISTS "Public bucket access" ON storage.buckets;
CREATE POLICY "Public bucket access"
ON storage.buckets FOR SELECT
TO public
USING (true);

-- Step 5: Ensure brand-assets bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets', 
  'brand-assets', 
  true, 
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Step 6: Fix brands table RLS policies
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Drop existing brand policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.brands;
DROP POLICY IF EXISTS "Enable insert for admins only" ON public.brands;
DROP POLICY IF EXISTS "Enable update for admins and brand owners" ON public.brands;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.brands;
DROP POLICY IF EXISTS "Anyone can view brands" ON public.brands;
DROP POLICY IF EXISTS "Authenticated users can insert brands" ON public.brands;
DROP POLICY IF EXISTS "Users can update their own brands" ON public.brands;
DROP POLICY IF EXISTS "Public read access to brands" ON public.brands;
DROP POLICY IF EXISTS "Authenticated users can update brands" ON public.brands;
DROP POLICY IF EXISTS "Authenticated users can delete brands" ON public.brands;

-- Create simple, permissive brand policies
CREATE POLICY "brands_public_read"
ON public.brands FOR SELECT
TO public
USING (true);

CREATE POLICY "brands_auth_insert"
ON public.brands FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "brands_auth_update"
ON public.brands FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "brands_auth_delete"
ON public.brands FOR DELETE
TO authenticated
USING (true);

-- Step 7: Verify the setup
SELECT 'Storage Policies Created:' as info;
SELECT policyname, cmd, permissive, roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE 'brand_assets%'
ORDER BY policyname;

SELECT 'Brand Table Policies Created:' as info;
SELECT policyname, cmd, permissive, roles
FROM pg_policies 
WHERE tablename = 'brands' 
  AND schemaname = 'public'
ORDER BY policyname;

SELECT 'Brand Assets Bucket Configuration:' as info;
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'brand-assets'; 