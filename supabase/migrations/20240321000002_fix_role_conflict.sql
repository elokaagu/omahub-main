-- First, drop the dependent policies
DROP POLICY IF EXISTS "Allow admin users to manage hero_slides" ON hero_slides;
DROP POLICY IF EXISTS "Enable insert for admins only" ON brands;
DROP POLICY IF EXISTS "Enable update for admins and brand owners" ON brands;
DROP POLICY IF EXISTS "Enable delete for admins only" ON brands;

-- Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_role;

-- Create the user_role enum type if it doesn't exist
DO $$ 
BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'brand_admin', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- First ensure all roles are valid strings
UPDATE profiles 
SET role = 'user' 
WHERE role NOT IN ('user', 'brand_admin', 'admin', 'super_admin', 'brand_owner');

-- Update any existing brand_owner roles to brand_admin
UPDATE profiles 
SET role = 'brand_admin' 
WHERE role = 'brand_owner';

-- Add a temporary column with the new type
ALTER TABLE profiles 
ADD COLUMN role_new user_role;

-- Convert existing roles to the new type
UPDATE profiles 
SET role_new = role::user_role;

-- Drop the old column and rename the new one
ALTER TABLE profiles 
DROP COLUMN role;

ALTER TABLE profiles 
RENAME COLUMN role_new TO role;

-- Set the default value
ALTER TABLE profiles 
ALTER COLUMN role SET DEFAULT 'user'::user_role;

-- Add the new constraint
ALTER TABLE profiles 
ADD CONSTRAINT valid_role CHECK (role::text IN ('user', 'brand_admin', 'admin', 'super_admin'));

-- Recreate the policies
CREATE POLICY "Allow admin users to manage hero_slides" ON hero_slides
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role::text IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Enable insert for admins only" ON brands
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role::text IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Enable update for admins and brand owners" ON brands
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
            profiles.role::text IN ('admin', 'super_admin')
            OR (profiles.role::text = 'brand_admin' AND brands.id::uuid = ANY(profiles.owned_brands))
        )
    )
);

CREATE POLICY "Enable delete for admins only" ON brands
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role::text IN ('admin', 'super_admin')
    )
); 