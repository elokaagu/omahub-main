-- Fix RLS policies for brands table
-- Run this in Supabase Dashboard > SQL Editor

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
DROP POLICY IF EXISTS "public_read_brands" ON brands;
DROP POLICY IF EXISTS "authenticated_update_brands" ON brands;
DROP POLICY IF EXISTS "authenticated_insert_brands" ON brands;
DROP POLICY IF EXISTS "authenticated_delete_brands" ON brands;
DROP POLICY IF EXISTS "brands_public_read" ON brands;
DROP POLICY IF EXISTS "brands_auth_insert" ON brands;
DROP POLICY IF EXISTS "brands_auth_update" ON brands;
DROP POLICY IF EXISTS "brands_auth_delete" ON brands;

-- Step 2: Create new simple, permissive policies
CREATE POLICY "brands_public_read"
  ON brands FOR SELECT
  USING (true);

CREATE POLICY "brands_auth_insert"
  ON brands FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "brands_auth_update"
  ON brands FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "brands_auth_delete"
  ON brands FOR DELETE
  TO authenticated
  USING (true);

-- Step 3: Verify the policies were created
SELECT 'RLS Policies for brands table:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'brands'
ORDER BY cmd, policyname; 