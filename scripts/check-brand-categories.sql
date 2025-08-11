-- Check current brand categories in the database
-- This will help identify duplicates and missing categories

-- 1. Show all unique categories currently in use
SELECT 
  category,
  COUNT(*) as brand_count
FROM brands 
WHERE category IS NOT NULL
GROUP BY category
ORDER BY brand_count DESC;

-- 2. Show brands with "High End" in their category name
SELECT 
  id,
  name,
  category,
  created_at
FROM brands 
WHERE category ILIKE '%High End%'
ORDER BY created_at DESC;

-- 3. Show brands with "Ready to Wear" or similar
SELECT 
  id,
  name,
  category,
  created_at
FROM brands 
WHERE category ILIKE '%Ready%' OR category ILIKE '%Casual%'
ORDER BY created_at DESC;

-- 4. Check if there are any brands with "Vacation" category
SELECT 
  id,
  name,
  category,
  created_at
FROM brands 
WHERE category ILIKE '%Vacation%' OR category ILIKE '%Resort%'
ORDER BY created_at DESC;

-- 5. Show all categories with their brand counts for analysis
SELECT 
  category,
  COUNT(*) as brand_count,
  STRING_AGG(name, ', ' ORDER BY name) as brand_names
FROM brands 
WHERE category IS NOT NULL
GROUP BY category
ORDER BY brand_count DESC;
