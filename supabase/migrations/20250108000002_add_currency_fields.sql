-- Add Currency Fields and Fix Currency Inconsistencies
-- This migration ensures proper currency handling across brands and products

-- Step 1: Add currency field to brands table
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3);

-- Step 2: Add currency field to products table  
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3);

-- Step 3: Update existing brands with correct currencies based on location
UPDATE public.brands 
SET currency = 'GHS'
WHERE location ILIKE '%Ghana%' 
   OR location ILIKE '%Accra%' 
   OR location ILIKE '%Kumasi%' 
   OR location ILIKE '%Tamale%';

UPDATE public.brands 
SET currency = 'NGN'
WHERE location ILIKE '%Nigeria%' 
   OR location ILIKE '%Lagos%' 
   OR location ILIKE '%Abuja%' 
   OR location ILIKE '%Port Harcourt%';

UPDATE public.brands 
SET currency = 'KES'
WHERE location ILIKE '%Kenya%' 
   OR location ILIKE '%Nairobi%' 
   OR location ILIKE '%Mombasa%' 
   OR location ILIKE '%Kisumu%';

UPDATE public.brands 
SET currency = 'ZAR'
WHERE location ILIKE '%South Africa%' 
   OR location ILIKE '%Johannesburg%' 
   OR location ILIKE '%Cape Town%' 
   OR location ILIKE '%Durban%';

UPDATE public.brands 
SET currency = 'EGP'
WHERE location ILIKE '%Egypt%' 
   OR location ILIKE '%Cairo%' 
   OR location ILIKE '%Alexandria%' 
   OR location ILIKE '%Giza%';

UPDATE public.brands 
SET currency = 'MAD'
WHERE location ILIKE '%Morocco%' 
   OR location ILIKE '%Casablanca%' 
   OR location ILIKE '%Rabat%' 
   OR location ILIKE '%Marrakech%';

UPDATE public.brands 
SET currency = 'TND'
WHERE location ILIKE '%Tunisia%' 
   OR location ILIKE '%Tunis%' 
   OR location ILIKE '%Sfax%' 
   OR location ILIKE '%Sousse%';

UPDATE public.brands 
SET currency = 'XOF'
WHERE location ILIKE '%Senegal%' 
   OR location ILIKE '%Ivory Coast%' 
   OR location ILIKE '%Burkina Faso%' 
   OR location ILIKE '%Mali%';

UPDATE public.brands 
SET currency = 'DZD'
WHERE location ILIKE '%Algeria%' 
   OR location ILIKE '%Algiers%' 
   OR location ILIKE '%Oran%' 
   OR location ILIKE '%Constantine%';

UPDATE public.brands 
SET currency = 'USD'
WHERE location ILIKE '%United States%' 
   OR location ILIKE '%USA%';

UPDATE public.brands 
SET currency = 'EUR'
WHERE location ILIKE '%European Union%' 
   OR location ILIKE '%EU%';

UPDATE public.brands 
SET currency = 'GBP'
WHERE location ILIKE '%United Kingdom%' 
   OR location ILIKE '%UK%' 
   OR location ILIKE '%England%' 
   OR location ILIKE '%Scotland%' 
   OR location ILIKE '%Wales%';

-- Step 4: Set default currency for any remaining brands (fallback to USD)
UPDATE public.brands 
SET currency = 'USD'
WHERE currency IS NULL;

-- Step 5: Make currency field NOT NULL after setting all values
ALTER TABLE public.brands 
ALTER COLUMN currency SET NOT NULL;

-- Step 6: Create index on currency for better performance
CREATE INDEX IF NOT EXISTS idx_brands_currency ON public.brands(currency);

-- Step 7: Update price_range fields to use correct currency symbols
UPDATE public.brands 
SET price_range = REPLACE(price_range, '₦', 'GHS')
WHERE currency = 'GHS' AND price_range LIKE '₦%';

UPDATE public.brands 
SET price_range = REPLACE(price_range, 'GHS', '₦')
WHERE currency = 'NGN' AND price_range LIKE 'GHS%';

UPDATE public.brands 
SET price_range = REPLACE(price_range, '₦', 'KSh')
WHERE currency = 'KES' AND price_range LIKE '₦%';

UPDATE public.brands 
SET price_range = REPLACE(price_range, '₦', 'R')
WHERE currency = 'ZAR' AND price_range LIKE '₦%';

UPDATE public.brands 
SET price_range = REPLACE(price_range, '₦', 'EGP')
WHERE currency = 'EGP' AND price_range LIKE '₦%';

UPDATE public.brands 
SET price_range = REPLACE(price_range, '₦', 'MAD')
WHERE currency = 'MAD' AND price_range LIKE '₦%';

UPDATE public.brands 
SET price_range = REPLACE(price_range, '₦', 'TND')
WHERE currency = 'TND' AND price_range LIKE '₦%';

UPDATE public.brands 
SET price_range = REPLACE(price_range, '₦', 'XOF')
WHERE currency = 'XOF' AND price_range LIKE '₦%';

UPDATE public.brands 
SET price_range = REPLACE(price_range, '₦', 'DA')
WHERE currency = 'DZD' AND price_range LIKE '₦%';

-- Step 8: Add constraint to ensure valid currency codes
ALTER TABLE public.brands 
ADD CONSTRAINT check_valid_currency 
CHECK (currency IN ('NGN', 'GHS', 'KES', 'ZAR', 'EGP', 'MAD', 'TND', 'XOF', 'DZD', 'USD', 'EUR', 'GBP'));

-- Step 9: Create a function to automatically update product currencies when brand currency changes
CREATE OR REPLACE FUNCTION update_product_currency_on_brand_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all products for this brand to use the new currency
  UPDATE public.products 
  SET currency = NEW.currency
  WHERE brand_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create trigger to automatically update product currencies
CREATE TRIGGER update_product_currency_trigger
  AFTER UPDATE OF currency ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION update_product_currency_on_brand_change();

-- Migration completed successfully
-- All brands now have proper currency fields
-- Price ranges have been updated to match brand currencies
-- Products will automatically inherit brand currencies
