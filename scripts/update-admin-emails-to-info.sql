-- Update admin emails to use info@oma-hub.com instead of shannonalisa@oma-hub.com
-- This script updates the platform_settings table to replace shannonalisa@oma-hub.com with info@oma-hub.com

-- Update super_admin_emails
UPDATE platform_settings
SET 
  value = jsonb_set(
    value::jsonb,
    '{0}',
    '"info@oma-hub.com"',
    false 
  )::text
WHERE key = 'super_admin_emails'
  AND value::jsonb @> '["shannonalisa@oma-hub.com"]';

-- Alternative approach: Replace the entire array if the above doesn't work
-- This will replace shannonalisa@oma-hub.com with info@oma-hub.com in super_admin_emails
UPDATE platform_settings
SET value = '["eloka.agu@icloud.com", "info@oma-hub.com"]'
WHERE key = 'super_admin_emails'
  AND value::jsonb @> '["shannonalisa@oma-hub.com"]';

-- Update webhook_admin_emails
UPDATE platform_settings
SET value = '["eloka.agu@icloud.com", "info@oma-hub.com", "eloka@satellitelabs.xyz"]'
WHERE key = 'webhook_admin_emails'
  AND value::jsonb @> '["shannonalisa@oma-hub.com"]';

-- Verify the changes
SELECT 
  key,
  value,
  description,
  updated_at
FROM platform_settings 
WHERE key IN ('super_admin_emails', 'webhook_admin_emails')
ORDER BY key;
