-- Fix owned_brands column to accept text arrays instead of UUID arrays
-- This is needed because brand IDs are strings, not UUIDs

-- First, let's check the current state
SELECT 'Current owned_brands column info:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'owned_brands';

-- Check current data
SELECT 'Current profiles with owned_brands:' as info;
SELECT id, email, role, owned_brands 
FROM profiles 
WHERE owned_brands IS NOT NULL AND array_length(owned_brands, 1) > 0;

-- Drop existing policies that reference owned_brands with UUID casting
DROP POLICY IF EXISTS "Enable update for admins and brand owners" ON brands;

-- Change the column type from uuid[] to text[]
ALTER TABLE profiles 
ALTER COLUMN owned_brands TYPE text[] USING owned_brands::text[];

-- Recreate the policy with correct text comparison
CREATE POLICY "Enable update for admins and brand owners" ON brands
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
            profiles.role::text IN ('admin', 'super_admin')
            OR (profiles.role::text = 'brand_admin' AND brands.id = ANY(profiles.owned_brands))
        )
    )
);

-- Verify the change
SELECT 'Updated owned_brands column info:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'owned_brands';

-- Show the updated policy
SELECT 'Updated policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'brands' AND policyname = 'Enable update for admins and brand owners'; 