-- Migration: Add ALL Studio currencies to database constraints
-- This ensures all currencies selectable in Studio can be saved to database

-- Step 1: Drop the existing constraints
ALTER TABLE public.brands 
DROP CONSTRAINT IF EXISTS brands_currency_check;

ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_currency_check;

-- Step 2: Recreate the constraints with ALL Studio currencies
ALTER TABLE public.brands 
ADD CONSTRAINT brands_currency_check 
CHECK (currency IN (
  'NONE',  -- Special option for no currency
  'USD', 'GBP', 'EUR', 'NGN', 'CAD', 'AUD',  -- Major international currencies
  'GHS', 'KES', 'ZAR', 'EGP', 'MAD', 'TND', 'XOF', 'DZD'  -- African currencies
));

ALTER TABLE public.products 
ADD CONSTRAINT products_currency_check 
CHECK (currency IN (
  'NONE',  -- Special option for no currency
  'USD', 'GBP', 'EUR', 'NGN', 'CAD', 'AUD',  -- Major international currencies
  'GHS', 'KES', 'ZAR', 'EGP', 'MAD', 'TND', 'XOF', 'DZD'  -- African currencies
));

-- Step 3: Verify the constraints were applied
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname IN ('brands_currency_check', 'products_currency_check');

-- Step 4: Show all supported currencies
SELECT 
  'Supported currencies in database:' as info,
  'NONE, USD, GBP, EUR, NGN, CAD, AUD, GHS, KES, ZAR, EGP, MAD, TND, XOF, DZD' as currencies;
