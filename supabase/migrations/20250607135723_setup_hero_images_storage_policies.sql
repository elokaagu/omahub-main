-- Setup storage policies for hero-images bucket

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "hero-images_public_select" ON storage.objects;
DROP POLICY IF EXISTS "hero-images_super_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "hero-images_super_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "hero-images_super_admin_delete" ON storage.objects;

-- Create policies for hero-images bucket
-- Public read access (anyone can view hero images)
CREATE POLICY "hero-images_public_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'hero-images');

-- Super admin insert access (only super admins can upload hero images)
CREATE POLICY "hero-images_super_admin_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'hero-images' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text = 'super_admin'
  )
);

-- Super admin update access (only super admins can update hero images)
CREATE POLICY "hero-images_super_admin_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'hero-images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text = 'super_admin'
  )
);

-- Super admin delete access (only super admins can delete hero images)
CREATE POLICY "hero-images_super_admin_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'hero-images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text = 'super_admin'
  )
);
