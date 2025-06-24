-- Add owned_brands array to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS owned_brands uuid[] DEFAULT '{}';

-- Add check constraint to ensure role is valid
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_role;
ALTER TABLE profiles ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'brand_owner', 'user'));

-- Create RLS policies for brand ownership
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
ON brands FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for admins only"
ON brands FOR INSERT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Enable update for admins and brand owners"
ON brands FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role = 'admin'
      OR (
        profiles.role = 'brand_owner'
        AND brands.id = ANY(profiles.owned_brands)
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
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
); 