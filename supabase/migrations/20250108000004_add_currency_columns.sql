-- Migration: Add currency columns to products and brands tables
-- This fixes the schema issue where currency information is missing

-- Step 1: Add currency column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';

-- Step 2: Add currency column to brands table  
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';

-- Step 3: Update existing products to use USD as default currency
UPDATE public.products 
SET currency = 'USD' 
WHERE currency IS NULL;

-- Step 4: Update existing brands to use USD as default currency
UPDATE public.brands 
SET currency = 'USD' 
WHERE currency IS NULL;

-- Step 5: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_currency ON public.products(currency);
CREATE INDEX IF NOT EXISTS idx_brands_currency ON public.brands(currency);

-- Step 6: Add constraints to ensure valid currency values
ALTER TABLE public.products 
ADD CONSTRAINT products_currency_check 
CHECK (currency IN ('USD', 'GBP', 'EUR', 'NGN', 'CAD', 'AUD'));

ALTER TABLE public.brands 
ADD CONSTRAINT brands_currency_check 
CHECK (currency IN ('USD', 'GBP', 'EUR', 'NGN', 'CAD', 'AUD'));

-- Step 7: Update specific brands that should be in USD
UPDATE public.brands 
SET currency = 'USD' 
WHERE name IN ('PITH AFRICA', '54 Stitches', 'Burgundy Atelier', 'Style Envie');

-- Step 8: Update products to match their brand's currency
UPDATE public.products 
SET currency = (
  SELECT b.currency 
  FROM public.brands b 
  WHERE b.id = public.products.brand_id
)
WHERE currency IS NULL OR currency = 'USD';
