-- Check if brand video fields exist and contain data
-- Run this script to diagnose brand video issues

-- 1. Check if the video columns exist in the brands table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'brands' 
  AND column_name IN ('video_url', 'video_thumbnail')
ORDER BY column_name;

-- 2. Check how many brands have video URLs
SELECT 
  COUNT(*) as total_brands,
  COUNT(video_url) as brands_with_videos,
  COUNT(video_thumbnail) as brands_with_thumbnails
FROM brands;

-- 3. Show sample brands with videos
SELECT 
  id,
  name,
  video_url,
  video_thumbnail,
  created_at,
  updated_at
FROM brands 
WHERE video_url IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- 4. Check storage buckets for video files
SELECT 
  bucket_id,
  COUNT(*) as file_count
FROM storage.objects 
WHERE bucket_id IN ('product-videos', 'brand-assets')
GROUP BY bucket_id;

-- 5. Check recent video uploads to product-videos bucket
SELECT 
  name,
  bucket_id,
  created_at,
  updated_at
FROM storage.objects 
WHERE bucket_id = 'product-videos'
  AND name LIKE '%brands%'
ORDER BY created_at DESC
LIMIT 10;
