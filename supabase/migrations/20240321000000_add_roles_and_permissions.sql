-- Create an enum for user roles
CREATE TYPE user_role AS ENUM ('user', 'brand_admin', 'admin', 'super_admin');

-- Update profiles table
ALTER TABLE profiles 
  ALTER COLUMN role TYPE user_role USING role::user_role,
  ALTER COLUMN role SET DEFAULT 'user'::user_role;

-- Add RLS policies for role-based access

-- Profiles policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    -- Users can't change their role
    (role IS NOT DISTINCT FROM OLD.role) OR
    -- Only super_admins can change roles
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Brands policies
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read brands"
  ON brands FOR SELECT
  USING (true);

CREATE POLICY "Admins and brand owners can update brands"
  ON brands FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (
        role IN ('admin', 'super_admin') OR
        (role = 'brand_admin' AND owned_brands ? id::text)
      )
    )
  );

CREATE POLICY "Admins and brand owners can delete brands"
  ON brands FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (
        role IN ('admin', 'super_admin') OR
        (role = 'brand_admin' AND owned_brands ? id::text)
      )
    )
  );

CREATE POLICY "Admins and brand admins can insert brands"
  ON brands FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('brand_admin', 'admin', 'super_admin')
    )
  );

-- Collections policies
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read collections"
  ON collections FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage collections"
  ON collections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create function to check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(user_id uuid, required_role user_role)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND (
      CASE required_role
        WHEN 'super_admin' THEN role = 'super_admin'
        WHEN 'admin' THEN role IN ('admin', 'super_admin')
        WHEN 'brand_admin' THEN role IN ('brand_admin', 'admin', 'super_admin')
        ELSE true
      END
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 