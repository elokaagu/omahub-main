-- Diagnostic script for Review Management System
-- Run this first to see what's missing

-- Check if reviews table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews' AND table_schema = 'public') 
    THEN '✅ reviews table exists' 
    ELSE '❌ reviews table missing' 
  END as reviews_table_status;

-- Check if review_replies table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'review_replies' AND table_schema = 'public') 
    THEN '✅ review_replies table exists' 
    ELSE '❌ review_replies table missing' 
  END as review_replies_table_status;

-- Check if reviews_with_details view exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'reviews_with_details' AND table_schema = 'public') 
    THEN '✅ reviews_with_details view exists' 
    ELSE '❌ reviews_with_details view missing' 
  END as reviews_view_status;

-- Check if brands table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brands' AND table_schema = 'public') 
    THEN '✅ brands table exists' 
    ELSE '❌ brands table missing' 
  END as brands_table_status;

-- Check if profiles table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') 
    THEN '✅ profiles table exists' 
    ELSE '❌ profiles table missing' 
  END as profiles_table_status;

-- Count existing reviews
SELECT COUNT(*) as total_reviews FROM public.reviews;

-- Sample review data (if any exists)
SELECT id, brand_id, author, rating, created_at 
FROM public.reviews 
ORDER BY created_at DESC 
LIMIT 5; 