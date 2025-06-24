-- Check the actual structure of the reviews table
-- Run this in Supabase SQL Editor to see what columns exist

-- 1. Check if reviews table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews' AND table_schema = 'public') 
    THEN '✅ reviews table exists' 
    ELSE '❌ reviews table missing' 
  END as reviews_table_status;

-- 2. Show all columns in the reviews table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'reviews' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check specifically for user_id column
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'reviews' 
        AND column_name = 'user_id' 
        AND table_schema = 'public'
    ) 
    THEN '✅ user_id column exists' 
    ELSE '❌ user_id column missing' 
  END as user_id_column_status;

-- 4. Check for other expected columns
SELECT 
  column_name,
  CASE 
    WHEN column_name IN ('id', 'brand_id', 'author', 'comment', 'rating', 'date', 'created_at', 'updated_at', 'user_id') 
    THEN '✅ Expected column' 
    ELSE '⚠️ Unexpected column' 
  END as column_status
FROM information_schema.columns 
WHERE table_name = 'reviews' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Sample data from reviews table (if any exists)
SELECT 
  COUNT(*) as total_reviews,
  MIN(created_at) as earliest_review,
  MAX(created_at) as latest_review
FROM public.reviews; 