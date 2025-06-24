-- Script to make eloka@culturin.com a brand owner for "ehbs coutre"

-- First, let's find the user with email eloka@culturin.com
-- and the brand "ehbs coutre"

-- Check if user exists
SELECT 'User Check:' as step, id, email, role, owned_brands 
FROM profiles 
WHERE email = 'eloka@culturin.com';

-- Check if brand exists (case insensitive search)
SELECT 'Brand Check:' as step, id, name, category, location 
FROM brands 
WHERE LOWER(name) LIKE '%ehbs%' OR LOWER(name) LIKE '%couture%';

-- If both exist, update the user to be a brand_admin and add the brand to owned_brands
-- Replace 'BRAND_ID_HERE' with the actual brand ID from the query above

-- Example update (you'll need to replace the brand ID):
-- UPDATE profiles 
-- SET 
--   role = 'brand_admin',
--   owned_brands = array_append(COALESCE(owned_brands, '{}'), 'BRAND_ID_HERE'::uuid)
-- WHERE email = 'eloka@culturin.com'
-- RETURNING id, email, role, owned_brands;

-- Verify the update
-- SELECT 'Final Check:' as step, p.id, p.email, p.role, p.owned_brands, b.name as brand_name
-- FROM profiles p
-- LEFT JOIN brands b ON b.id = ANY(p.owned_brands)
-- WHERE p.email = 'eloka@culturin.com'; 