-- Fix duplicate and inconsistent categories in the brands table
-- This script standardizes categories to match the unified category system

-- 1. First, let's see what we're working with
SELECT 
  category,
  COUNT(*) as brand_count
FROM brands 
WHERE category IS NOT NULL
GROUP BY category
ORDER BY brand_count DESC;

-- 2. Fix "High End Fashion Brand" -> "High End Fashion"
UPDATE brands 
SET category = 'High End Fashion'
WHERE category = 'High End Fashion Brand';

-- 3. Fix "High End Fashion Brands" -> "High End Fashion"  
UPDATE brands 
SET category = 'High End Fashion'
WHERE category = 'High End Fashion Brands';

-- 4. Fix "Casual Wear" -> "Ready to Wear"
UPDATE brands 
SET category = 'Ready to Wear'
WHERE category = 'Casual Wear';

-- 5. Fix "Formal Wear" -> "Ready to Wear"
UPDATE brands 
SET category = 'Ready to Wear'
WHERE category = 'Formal Wear';

-- 6. Fix "Jewelry" -> "Accessories"
UPDATE brands 
SET category = 'Accessories'
WHERE category = 'Jewelry';

-- 7. Fix "Couture" -> "Custom Design"
UPDATE brands 
SET category = 'Custom Design'
WHERE category = 'Couture';

-- 8. Fix "Luxury" -> "High End Fashion"
UPDATE brands 
SET category = 'High End Fashion'
WHERE category = 'Luxury';

-- 9. Fix "Streetwear" -> "Streetwear & Urban"
UPDATE brands 
SET category = 'Streetwear & Urban'
WHERE category = 'Streetwear';

-- 10. Show the results after cleanup
SELECT 
  category,
  COUNT(*) as brand_count
FROM brands 
WHERE category IS NOT NULL
GROUP BY category
ORDER BY brand_count DESC;

-- 11. Show any remaining inconsistent categories
SELECT 
  id,
  name,
  category,
  created_at
FROM brands 
WHERE category NOT IN (
  'Bridal',
  'Ready to Wear', 
  'Vacation & Resort',
  'Accessories',
  'Custom Design',
  'Evening Gowns',
  'High End Fashion',
  'Made to Measure',
  'Streetwear & Urban',
  'Alterations'
)
ORDER BY category, name;
