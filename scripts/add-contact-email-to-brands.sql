-- Add contact_email field to brands table and populate existing brands
-- This script adds the contact_email column and fills existing brands with a default email

-- Add contact_email column to brands table if it doesn't exist
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Add a comment to explain the field
COMMENT ON COLUMN public.brands.contact_email IS 'Primary contact email for customer inquiries and communication';

-- Update all existing brands that don't have a contact_email with the default email
UPDATE public.brands 
SET contact_email = 'eloka.agu@icloud.com'
WHERE contact_email IS NULL OR contact_email = '';

-- Verify the migration
SELECT id, name, contact_email FROM public.brands LIMIT 10;

-- Show count of brands updated
SELECT 
  COUNT(*) as total_brands,
  COUNT(CASE WHEN contact_email = 'eloka.agu@icloud.com' THEN 1 END) as brands_with_default_email,
  COUNT(CASE WHEN contact_email IS NOT NULL AND contact_email != '' THEN 1 END) as brands_with_email
FROM public.brands; 