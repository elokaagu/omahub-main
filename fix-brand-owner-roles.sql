-- Fix remaining brand_owner roles to brand_admin
-- This resolves the dropdown issue in the user management interface

-- First, check what roles currently exist
SELECT DISTINCT role FROM profiles ORDER BY role;

-- Check if there are any profiles with invalid roles (including brand_owner)
SELECT id, email, role 
FROM profiles 
WHERE role::text NOT IN ('user', 'brand_admin', 'admin', 'super_admin');

-- Update any profiles with invalid roles to 'user' as a fallback
-- This will catch any remaining brand_owner roles or other invalid values
UPDATE profiles 
SET role = 'user'::user_role
WHERE role::text NOT IN ('user', 'brand_admin', 'admin', 'super_admin');

-- Verify the update
SELECT DISTINCT role FROM profiles ORDER BY role;

-- Now check if there are any profiles that should be brand_admin
-- Look for users who have owned_brands but are currently 'user' role
SELECT id, email, role, owned_brands
FROM profiles 
WHERE role = 'user' 
AND owned_brands IS NOT NULL 
AND array_length(owned_brands, 1) > 0;

-- Update users with owned_brands to brand_admin role
UPDATE profiles 
SET role = 'brand_admin'::user_role
WHERE role = 'user' 
AND owned_brands IS NOT NULL 
AND array_length(owned_brands, 1) > 0;

-- Final verification
SELECT DISTINCT role FROM profiles ORDER BY role;
