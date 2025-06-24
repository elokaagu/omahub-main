-- Storage policies for brand image uploads
-- Run this in your Supabase dashboard SQL Editor

-- Drop existing policies if they exist (ignore errors if they don't exist)
DROP POLICY IF EXISTS "brand-assets_public_select" ON storage.objects;
DROP POLICY IF EXISTS "brand-assets_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "profiles_public_select" ON storage.objects;
DROP POLICY IF EXISTS "profiles_auth_insert" ON storage.objects;

-- Create policies for brand-assets bucket
CREATE POLICY "brand-assets_public_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'brand-assets');

CREATE POLICY "brand-assets_auth_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'brand-assets' 
  AND auth.role() = 'authenticated'
);

-- Create policies for profiles bucket
CREATE POLICY "profiles_public_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profiles');

CREATE POLICY "profiles_auth_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.role() = 'authenticated'
);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'; 