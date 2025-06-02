-- Check current user roles and permissions
SELECT 
  id,
  email,
  role,
  created_at,
  updated_at
FROM profiles 
ORDER BY created_at DESC;

-- Check specific user (replace with your email)
SELECT 
  id,
  email,
  role,
  created_at
FROM profiles 
WHERE email = 'your-email@example.com';

-- Update user to super_admin (replace with your email)
-- UPDATE profiles 
-- SET role = 'super_admin', updated_at = now()
-- WHERE email = 'your-email@example.com';

-- Update user to admin (replace with your email) 
-- UPDATE profiles 
-- SET role = 'admin', updated_at = now()
-- WHERE email = 'your-email@example.com';

-- Verify the update
-- SELECT 
--   id,
--   email,
--   role,
--   updated_at
-- FROM profiles 
-- WHERE email = 'your-email@example.com'; 