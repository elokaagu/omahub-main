-- Migration: Add GHS (Ghanaian Cedi) to allowed currencies
-- This fixes the constraint violation when trying to set currency to GHS

-- Step 1: Drop the existing constraint
ALTER TABLE public.brands 
DROP CONSTRAINT IF EXISTS brands_currency_check;

-- Step 2: Recreate the constraint with GHS added
ALTER TABLE public.brands 
ADD CONSTRAINT brands_currency_check 
CHECK (currency IN ('USD', 'GBP', 'EUR', 'NGN', 'CAD', 'AUD', 'GHS'));

-- Step 3: Also update the products table constraint
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_currency_check;

ALTER TABLE public.products 
ADD CONSTRAINT products_currency_check 
CHECK (currency IN ('USD', 'GBP', 'EUR', 'NGN', 'CAD', 'AUD', 'GHS'));

-- Step 4: Verify the constraint was applied
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname IN ('brands_currency_check', 'products_currency_check');
