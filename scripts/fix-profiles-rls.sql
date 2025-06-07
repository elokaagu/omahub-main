-- Fix RLS policies for profiles table to allow super admin access

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile during registration" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can create any profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;

-- Create comprehensive policies for profiles table

-- 1. Users can read their own profile
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 2. Super admins can read all profiles
CREATE POLICY "Super admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role::text = 'super_admin'
    )
  );

-- 3. Users can update their own profile (but not role)
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Users can't change their own role unless they're super admin
    (
      role IS NOT DISTINCT FROM OLD.role OR
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role::text = 'super_admin'
      )
    )
  );

-- 4. Super admins can update any profile
CREATE POLICY "Super admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role::text = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role::text = 'super_admin'
    )
  );

-- 5. Allow profile creation during signup
CREATE POLICY "Allow profile creation during signup"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 6. Super admins can create profiles for other users
CREATE POLICY "Super admins can create any profile"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role::text = 'super_admin'
    )
  );

-- 7. Super admins can delete profiles
CREATE POLICY "Super admins can delete profiles"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role::text = 'super_admin'
    )
  );

-- Verify the policies were created
SELECT 'RLS Policies for profiles table:' as info;
SELECT policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname; 