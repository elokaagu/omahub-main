-- Add owned_brands array to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS owned_brands uuid[] DEFAULT '{}';

-- Add role validation
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS valid_role;

ALTER TABLE profiles 
ADD CONSTRAINT valid_role 
CHECK (role IN ('admin', 'brand_owner', 'user'));

-- Enable RLS on brands table
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON brands;
DROP POLICY IF EXISTS "Enable insert for admins only" ON brands;
DROP POLICY IF EXISTS "Enable update for admins and brand owners" ON brands;
DROP POLICY IF EXISTS "Enable delete for admins only" ON brands;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON brands FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for admins only"
ON brands FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()::uuid
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Enable update for admins and brand owners"
ON brands FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()::uuid
    AND (
      profiles.role = 'admin'
      OR (
        profiles.role = 'brand_owner'
        AND brands.id::uuid = ANY(profiles.owned_brands)
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()::uuid
    AND (
      profiles.role = 'admin'
      OR (
        profiles.role = 'brand_owner'
        AND brands.id::uuid = ANY(profiles.owned_brands)
      )
    )
  )
);

CREATE POLICY "Enable delete for admins only"
ON brands FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()::uuid
    AND profiles.role = 'admin'
  )
); 