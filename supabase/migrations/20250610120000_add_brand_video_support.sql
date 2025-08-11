-- Add video support to brands table
ALTER TABLE brands 
ADD COLUMN video_url TEXT,
ADD COLUMN video_thumbnail TEXT;

-- Add comments for documentation
COMMENT ON COLUMN brands.video_url IS 'URL to brand campaign or intro video';
COMMENT ON COLUMN brands.video_thumbnail IS 'Thumbnail image for the brand video (fallback to image if not provided)'; 

-- Note: Brand videos are uploaded to the product-videos bucket, not brand-assets
-- The product-videos bucket already has proper policies set up in fix-video-upload-policies.sql
-- This migration only adds the database columns for storing video URLs 