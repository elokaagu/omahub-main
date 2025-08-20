-- Simple Role Fix - Run these commands one by one

-- Step 1: See what roles currently exist
SELECT DISTINCT role FROM profiles ORDER BY role;

-- Step 2: Find any profiles with invalid roles
SELECT id, email, role 
FROM profiles 
WHERE role::text NOT IN ('user', 'brand_admin', 'admin', 'super_admin');

-- Step 3: If you found invalid roles, update them to 'user' first
-- (Only run this if Step 2 returned results)
UPDATE profiles 
SET role = 'user'::user_role
WHERE role::text NOT IN ('user', 'brand_admin', 'admin', 'super_admin');

-- Step 4: Find users who should be brand_admin (have owned_brands)
SELECT id, email, role, owned_brands
FROM profiles 
WHERE role = 'user' 
AND owned_brands IS NOT NULL 
AND array_length(owned_brands, 1) > 0;

-- Step 5: Update those users to brand_admin role
-- (Only run this if Step 4 returned results)
UPDATE profiles 
SET role = 'brand_admin'::user_role
WHERE role = 'user' 
AND owned_brands IS NOT NULL 
AND array_length(owned_brands, 1) > 0;

-- Step 6: Final check - all roles should now be valid
SELECT DISTINCT role FROM profiles ORDER BY role;
