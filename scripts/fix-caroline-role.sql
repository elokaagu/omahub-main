-- Immediately fix Caroline's role to super_admin
-- This will give her proper super admin access

UPDATE profiles 
SET 
  role = 'super_admin',
  owned_brands = (
    SELECT array_agg(id::text) 
    FROM brands
  ),
  updated_at = NOW()
WHERE email = 'carolineeyo5@gmail.com';

-- Verify the fix
SELECT 
  id, 
  email, 
  role, 
  array_length(owned_brands, 1) as brand_count,
  created_at,
  updated_at
FROM profiles 
WHERE email = 'carolineeyo5@gmail.com';
