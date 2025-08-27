-- Fix location data by removing trailing 'O' characters
-- This script will clean up any location fields that have trailing 'O' characters

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

-- Verify the fix
SELECT 
  id,
  name,
  location,
  LENGTH(location) as location_length
FROM brands 
WHERE location LIKE '%O';

-- Show a summary of the changes
SELECT 
  COUNT(*) as total_brands,
  COUNT(CASE WHEN location LIKE '%O' THEN 1 END) as brands_with_trailing_o
FROM brands;
