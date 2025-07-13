-- Add video support to brands table
ALTER TABLE brands 
ADD COLUMN video_url TEXT,
ADD COLUMN video_thumbnail TEXT;

-- Add comments for documentation
COMMENT ON COLUMN brands.video_url IS 'URL to brand campaign or intro video';
COMMENT ON COLUMN brands.video_thumbnail IS 'Thumbnail image for the brand video (fallback to image if not provided)'; 

-- Storage policies for brand-assets bucket
-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for brand-assets if they exist
DROP POLICY IF EXISTS "brand-assets_public_select" ON storage.objects;
DROP POLICY IF EXISTS "brand-assets_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "brand-assets_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "brand-assets_auth_delete" ON storage.objects;

-- Public read access (anyone can view brand videos)
CREATE POLICY "brand-assets_public_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'brand-assets');

-- Authorized users can upload brand videos (super_admin, admin, brand_admin)
CREATE POLICY "brand-assets_auth_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'brand-assets'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text IN ('super_admin', 'admin', 'brand_admin')
  )
);

-- Authorized users can update brand videos
CREATE POLICY "brand-assets_auth_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'brand-assets'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text IN ('super_admin', 'admin', 'brand_admin')
  )
);

-- Authorized users can delete brand videos
CREATE POLICY "brand-assets_auth_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'brand-assets'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text IN ('super_admin', 'admin', 'brand_admin')
  )
); 