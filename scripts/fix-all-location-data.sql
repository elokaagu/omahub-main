-- Comprehensive location data cleaning script
-- This script will fix various location data issues in the brands table

-- First, let's see what locations have trailing 'O' characters
SELECT 
  id,
  name,
  location,
  LENGTH(location) as location_length,
  TRIM(TRAILING 'O' FROM location) as cleaned_location
FROM brands 
WHERE location LIKE '%O' 
  AND location != TRIM(TRAILING 'O' FROM location);

-- Now update all locations to remove trailing 'O' characters
UPDATE brands 
SET 
  location = TRIM(TRAILING 'O' FROM location),
  updated_at = NOW()
WHERE location LIKE '%O' 
  AND location != TRIM(TRAILING 'O' FROM location);

-- Also check for other common location data issues
-- Remove any trailing numbers that don't make sense
UPDATE brands 
SET 
  location = REGEXP_REPLACE(location, '([A-Za-z\s,]+)\d+$', '\1'),
  updated_at = NOW()
WHERE location ~ '[A-Za-z\s,]+\d+$'
  AND location != REGEXP_REPLACE(location, '([A-Za-z\s,]+)\d+$', '\1');

-- Clean up any locations that have multiple spaces
UPDATE brands 
SET 
  location = REGEXP_REPLACE(location, '\s+', ' '),
  updated_at = NOW()
WHERE location ~ '\s{2,}';

-- Trim any leading/trailing whitespace
UPDATE brands 
SET 
  location = TRIM(location),
  updated_at = NOW()
WHERE location != TRIM(location);

-- Verify the fixes
SELECT 
  id,
  name,
  location,
  LENGTH(location) as location_length
FROM brands 
WHERE location LIKE '%O' OR location ~ '\d+$' OR location ~ '\s{2,}';

-- Show a summary of the changes
SELECT 
  COUNT(*) as total_brands,
  COUNT(CASE WHEN location LIKE '%O' THEN 1 END) as brands_with_trailing_o,
  COUNT(CASE WHEN location ~ '\d+$' THEN 1 END) as brands_with_trailing_numbers,
  COUNT(CASE WHEN location ~ '\s{2,}' THEN 1 END) as brands_with_multiple_spaces
FROM brands;
