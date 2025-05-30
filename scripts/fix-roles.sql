-- Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_role;

-- Add the new constraint including super_admin
ALTER TABLE profiles ADD CONSTRAINT valid_role 
CHECK (role IN ('user', 'admin', 'super_admin', 'brand_owner'));

-- Update existing users to super_admin
UPDATE profiles 
SET role = 'super_admin', 
    updated_at = NOW()
WHERE email IN ('eloka@satellitelabs.xyz', 'eloka.agu@icloud.com'); 