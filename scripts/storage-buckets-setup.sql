-- SQL script to set up storage buckets and policies in Supabase
-- Run this in the Supabase SQL Editor

-- 1. Create the buckets (if they don't exist)
-- Check and create brand-assets bucket
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'brand-assets') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit)
        VALUES ('brand-assets', 'brand-assets', true, 10485760); -- 10MB limit
        RAISE NOTICE 'Created brand-assets bucket';
    ELSE
        RAISE NOTICE 'brand-assets bucket already exists';
    END IF;
END
$$;

-- Check and create avatars bucket
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'avatars') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit)
        VALUES ('avatars', 'avatars', true, 5242880); -- 5MB limit
        RAISE NOTICE 'Created avatars bucket';
    ELSE
        RAISE NOTICE 'avatars bucket already exists';
    END IF;
END
$$;

-- 2. Set up policies for the brand-assets bucket
-- Policy for public SELECT access to brand-assets
CREATE POLICY "brand-assets_public_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'brand-assets');

-- Policy for authenticated INSERT access to brand-assets
CREATE POLICY "brand-assets_auth_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'brand-assets' 
  AND auth.role() = 'authenticated'
);

-- Policy for owner UPDATE access to brand-assets
CREATE POLICY "brand-assets_owner_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'brand-assets' 
  AND auth.uid() = owner
);

-- Policy for owner DELETE access to brand-assets
CREATE POLICY "brand-assets_owner_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'brand-assets' 
  AND auth.uid() = owner
);

-- 3. Set up policies for the avatars bucket
-- Policy for public SELECT access to avatars
CREATE POLICY "avatars_public_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Policy for authenticated INSERT access to avatars
CREATE POLICY "avatars_auth_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Policy for owner UPDATE access to avatars
CREATE POLICY "avatars_owner_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid() = owner
);

-- Policy for owner DELETE access to avatars
CREATE POLICY "avatars_owner_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid() = owner
);

-- Notify completion
DO $$
BEGIN
    RAISE NOTICE 'Storage buckets and policies setup completed!';
END
$$; 