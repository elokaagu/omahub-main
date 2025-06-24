-- Fix Quick Edit Issue: RLS Policies for Brand Updates
-- Run this in your Supabase SQL Editor

-- Step 1: Drop all existing brand policies
DROP POLICY IF EXISTS "Enable read access for all users" ON brands;
DROP POLICY IF EXISTS "Enable insert for admins only" ON brands;
DROP POLICY IF EXISTS "Enable update for admins and brand owners" ON brands;
DROP POLICY IF EXISTS "Enable delete for admins only" ON brands;
DROP POLICY IF EXISTS "Anyone can view brands" ON brands;
DROP POLICY IF EXISTS "Authenticated users can insert brands" ON brands;
DROP POLICY IF EXISTS "Users can update their own brands" ON brands;
DROP POLICY IF EXISTS "Public read access to brands" ON brands;
DROP POLICY IF EXISTS "Authenticated users can update brands" ON brands;
DROP POLICY IF EXISTS "Authenticated users can delete brands" ON brands;
DROP POLICY IF EXISTS "Allow authenticated users to update brands" ON brands;
DROP POLICY IF EXISTS "public_read_brands" ON brands;
DROP POLICY IF EXISTS "authenticated_update_brands" ON brands;
DROP POLICY IF EXISTS "authenticated_insert_brands" ON brands;
DROP POLICY IF EXISTS "authenticated_delete_brands" ON brands;

-- Step 2: Create new permissive policies
-- Allow everyone to read brands
CREATE POLICY "public_read_brands"
  ON brands FOR SELECT
  USING (true);

-- Allow authenticated users to update brands
CREATE POLICY "authenticated_update_brands"
  ON brands FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to insert brands
CREATE POLICY "authenticated_insert_brands"
  ON brands FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to delete brands
CREATE POLICY "authenticated_delete_brands"
  ON brands FOR DELETE
  TO authenticated
  USING (true);

-- Step 3: Verify the policies were created
SELECT 'RLS Policies for brands table:' as info;
SELECT policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'brands'
ORDER BY cmd, policyname; 