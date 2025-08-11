-- Fix Caroline's Super Admin Role Assignment
-- This script investigates and fixes the role assignment issue

-- 1. Check current state of Caroline's profile
SELECT 
  id, 
  email, 
  role, 
  owned_brands,
  created_at,
  updated_at
FROM profiles 
WHERE email = 'carolineeyo5@gmail.com';

-- 2. Check all super admin users
SELECT 
  id, 
  email, 
  role, 
  owned_brands,
  created_at,
  updated_at
FROM profiles 
WHERE role = 'super_admin'
ORDER BY created_at DESC;

-- 3. Check if there are any role assignment inconsistencies
SELECT 
  email,
  role,
  CASE 
    WHEN role = 'super_admin' AND array_length(owned_brands, 1) < 10 THEN 'SUPER ADMIN WITH FEW BRANDS - POTENTIAL ISSUE'
    WHEN role = 'user' AND array_length(owned_brands, 1) > 20 THEN 'USER WITH MANY BRANDS - POTENTIAL ISSUE'
    ELSE 'OK'
  END as status,
  array_length(owned_brands, 1) as brand_count
FROM profiles 
WHERE owned_brands IS NOT NULL
ORDER BY brand_count DESC;

-- 4. Fix Caroline's role to super_admin and assign all brands
UPDATE profiles 
SET 
  role = 'super_admin',
  owned_brands = (
    SELECT array_agg(id::text) 
    FROM brands
  ),
  updated_at = NOW()
WHERE email = 'carolineeyo5@gmail.com';

-- 5. Verify the fix
SELECT 
  id, 
  email, 
  role, 
  owned_brands,
  array_length(owned_brands, 1) as brand_count,
  created_at,
  updated_at
FROM profiles 
WHERE email = 'carolineeyo5@gmail.com';

-- 6. Show all super admins after fix
SELECT 
  id, 
  email, 
  role, 
  array_length(owned_brands, 1) as brand_count,
  created_at,
  updated_at
FROM profiles 
WHERE role = 'super_admin'
ORDER BY created_at DESC;
