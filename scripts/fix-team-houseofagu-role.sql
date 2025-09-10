-- Fix team@houseofagu.com role to brand_admin
-- This user needs brand_admin role to create products

-- First, check current role
SELECT id, email, role, owned_brands, created_at, updated_at
FROM profiles
WHERE email = 'team@houseofagu.com';

-- Update role to brand_admin
UPDATE profiles 
SET role = 'brand_admin',
    updated_at = NOW()
WHERE email = 'team@houseofagu.com';

-- Verify the update
SELECT id, email, role, owned_brands, created_at, updated_at
FROM profiles
WHERE email = 'team@houseofagu.com';

-- If the user should have owned brands, add them here
-- Example: UPDATE profiles SET owned_brands = array_append(COALESCE(owned_brands, '{}'), 'brand-id-here') WHERE email = 'team@houseofagu.com';
