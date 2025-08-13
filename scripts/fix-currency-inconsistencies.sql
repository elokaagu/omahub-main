-- Fix Currency Inconsistencies in Brands
-- This script ensures each brand displays the correct currency based on their location

-- Update Ghanaian brands to use GHS currency
UPDATE brands 
SET price_range = REPLACE(price_range, '₦', 'GHS')
WHERE location ILIKE '%Ghana%' 
   OR location ILIKE '%Accra%' 
   OR location ILIKE '%Kumasi%' 
   OR location ILIKE '%Tamale%'
   AND price_range LIKE '₦%';

-- Update Nigerian brands to use NGN currency (ensure consistency)
UPDATE brands 
SET price_range = REPLACE(price_range, '$', '₦')
WHERE location ILIKE '%Nigeria%' 
   OR location ILIKE '%Lagos%' 
   OR location ILIKE '%Abuja%' 
   OR location ILIKE '%Port Harcourt%'
   AND (price_range LIKE '$%' OR price_range NOT LIKE '₦%');

-- Update Kenyan brands to use KES currency
UPDATE brands 
SET price_range = REPLACE(price_range, '₦', 'KSh')
WHERE location ILIKE '%Kenya%' 
   OR location ILIKE '%Nairobi%' 
   OR location ILIKE '%Mombasa%' 
   OR location ILIKE '%Kisumu%'
   AND price_range LIKE '₦%';

-- Update South African brands to use ZAR currency
UPDATE brands 
SET price_range = REPLACE(price_range, '₦', 'R')
WHERE location ILIKE '%South Africa%' 
   OR location ILIKE '%Johannesburg%' 
   OR location ILIKE '%Cape Town%' 
   OR location ILIKE '%Durban%'
   AND price_range LIKE '₦%';

-- Update Egyptian brands to use EGP currency
UPDATE brands 
SET price_range = REPLACE(price_range, '₦', 'EGP')
WHERE location ILIKE '%Egypt%' 
   OR location ILIKE '%Cairo%' 
   OR location ILIKE '%Alexandria%' 
   OR location ILIKE '%Giza%'
   AND price_range LIKE '₦%';

-- Update Moroccan brands to use MAD currency
UPDATE brands 
SET price_range = REPLACE(price_range, '₦', 'MAD')
WHERE location ILIKE '%Morocco%' 
   OR location ILIKE '%Casablanca%' 
   OR location ILIKE '%Rabat%' 
   OR location ILIKE '%Marrakech%'
   AND price_range LIKE '₦%';

-- Update Tunisian brands to use TND currency
UPDATE brands 
SET price_range = REPLACE(price_range, '₦', 'TND')
WHERE location ILIKE '%Tunisia%' 
   OR location ILIKE '%Tunis%' 
   OR location ILIKE '%Sfax%' 
   OR location ILIKE '%Sousse%'
   AND price_range LIKE '₦%';

-- Update West African CFA Franc countries
UPDATE brands 
SET price_range = REPLACE(price_range, '₦', 'XOF')
WHERE location ILIKE '%Senegal%' 
   OR location ILIKE '%Ivory Coast%' 
   OR location ILIKE '%Burkina Faso%' 
   OR location ILIKE '%Mali%'
   AND price_range LIKE '₦%';

-- Update Algerian brands to use DZD currency
UPDATE brands 
SET price_range = REPLACE(price_range, '₦', 'DA')
WHERE location ILIKE '%Algeria%' 
   OR location ILIKE '%Algiers%' 
   OR location ILIKE '%Oran%' 
   OR location ILIKE '%Constantine%'
   AND price_range LIKE '₦%';

-- Fix specific brand examples mentioned in the issue
-- Update "Rena" brand (Ghanaian) to use GHS
UPDATE brands 
SET price_range = 'GHS1,000 - GHS5,000'
WHERE name ILIKE '%Rena%' 
   OR (location ILIKE '%Ghana%' AND price_range LIKE '%1,000%');

-- Update "Ivy Pant Set" brand (Nigerian) to use NGN
UPDATE brands 
SET price_range = '₦1,500 - ₦3,000'
WHERE name ILIKE '%Ivy%' 
   OR (location ILIKE '%Nigeria%' AND price_range LIKE '%1,500%');

-- Verify the fixes
SELECT 
    name,
    location,
    price_range,
    CASE 
        WHEN location ILIKE '%Ghana%' AND price_range LIKE 'GHS%' THEN '✅ Correct'
        WHEN location ILIKE '%Nigeria%' AND price_range LIKE '₦%' THEN '✅ Correct'
        WHEN location ILIKE '%Kenya%' AND price_range LIKE 'KSh%' THEN '✅ Correct'
        WHEN location ILIKE '%South Africa%' AND price_range LIKE 'R%' THEN '✅ Correct'
        WHEN location ILIKE '%Egypt%' AND price_range LIKE 'EGP%' THEN '✅ Correct'
        WHEN location ILIKE '%Morocco%' AND price_range LIKE 'MAD%' THEN '✅ Correct'
        WHEN location ILIKE '%Tunisia%' AND price_range LIKE 'TND%' THEN '✅ Correct'
        WHEN location ILIKE '%Senegal%' AND price_range LIKE 'XOF%' THEN '✅ Correct'
        WHEN location ILIKE '%Algeria%' AND price_range LIKE 'DA%' THEN '✅ Correct'
        ELSE '⚠️ Needs Review'
    END as currency_status
FROM brands 
ORDER BY location, name;
