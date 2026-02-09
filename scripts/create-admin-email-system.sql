-- Create Admin Email Management System
-- This migration sets up a database-driven system for managing admin emails
-- instead of hardcoding them throughout the application

-- 1. Add admin email settings to platform_settings table
INSERT INTO platform_settings (key, value, description, created_at, updated_at)
VALUES 
  ('super_admin_emails', '["eloka.agu@icloud.com", "info@oma-hub.com"]', 'Array of super admin email addresses', NOW(), NOW()),
  ('brand_admin_emails', '["eloka@culturin.com"]', 'Array of brand admin email addresses', NOW(), NOW()),
  ('webhook_admin_emails', '["eloka.agu@icloud.com", "info@oma-hub.com", "eloka@satellitelabs.xyz"]', 'Array of admin emails for webhook notifications', NOW(), NOW())
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 2. Create a function to check if an email is a super admin
CREATE OR REPLACE FUNCTION is_super_admin(check_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  admin_emails JSONB;
BEGIN
  SELECT value::JSONB INTO admin_emails
  FROM platform_settings 
  WHERE key = 'super_admin_emails';
  
  RETURN admin_emails ? check_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a function to check if an email is a brand admin
CREATE OR REPLACE FUNCTION is_brand_admin(check_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  admin_emails JSONB;
BEGIN
  SELECT value::JSONB INTO admin_emails
  FROM platform_settings 
  WHERE key = 'brand_admin_emails';
  
  RETURN admin_emails ? check_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create a function to get all admin emails for a specific type
CREATE OR REPLACE FUNCTION get_admin_emails(admin_type TEXT DEFAULT 'super_admin')
RETURNS TEXT[] AS $$
DECLARE
  admin_emails JSONB;
  result TEXT[];
BEGIN
  SELECT value::JSONB INTO admin_emails
  FROM platform_settings 
  WHERE key = admin_type || '_emails';
  
  IF admin_emails IS NOT NULL THEN
    SELECT array_agg(value::TEXT) INTO result
    FROM jsonb_array_elements_text(admin_emails);
  END IF;
  
  RETURN COALESCE(result, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(key);

-- 6. Add RLS policies for platform_settings if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'platform_settings' 
    AND policyname = 'Allow public read access to platform settings'
  ) THEN
    CREATE POLICY "Allow public read access to platform settings"
    ON platform_settings FOR SELECT
    USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'platform_settings' 
    AND policyname = 'Allow super admins to manage platform settings'
  ) THEN
    CREATE POLICY "Allow super admins to manage platform settings"
    ON platform_settings FOR ALL
    TO authenticated
    USING (is_super_admin(auth.jwt() ->> 'email'));
  END IF;
END $$;

-- 7. Verify the setup
SELECT 
  key,
  value,
  description,
  created_at,
  updated_at
FROM platform_settings 
WHERE key LIKE '%_admin_emails'
ORDER BY key;

-- 8. Test the functions
SELECT 
  'eloka.agu@icloud.com' as email,
  is_super_admin('eloka.agu@icloud.com') as is_super_admin,
  is_brand_admin('eloka.agu@icloud.com') as is_brand_admin;

SELECT 
  'info@oma-hub.com' as email,
  is_super_admin('info@oma-hub.com') as is_super_admin,
  is_brand_admin('info@oma-hub.com') as is_brand_admin;

SELECT 
  'eloka@culturin.com' as email,
  is_super_admin('eloka@culturin.com') as is_super_admin,
  is_brand_admin('eloka@culturin.com') as is_brand_admin;

-- 9. Show all admin emails
SELECT 
  'super_admin_emails' as type,
  get_admin_emails('super_admin') as emails
UNION ALL
SELECT 
  'brand_admin_emails' as type,
  get_admin_emails('brand_admin') as emails
UNION ALL
SELECT 
  'webhook_admin_emails' as type,
  get_admin_emails('webhook_admin') as emails;
