-- Migration: Add currency columns to products and brands tables
-- This fixes the schema issue where currency information is missing

-- Step 1: Add currency column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS currency text;

-- Step 2: Add currency column to brands table  
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS currency text;

-- Step 3: Only set USD for brands that should explicitly have it
UPDATE public.brands 
SET currency = 'USD' 
WHERE name IN ('PITH AFRICA', '54 Stitches', 'Burgundy Atelier', 'Style Envie') 
  AND (currency IS NULL OR currency = '');

-- Step 4: Only set USD for products of brands that have USD currency
UPDATE public.products 
SET currency = 'USD' 
WHERE brand_id IN (
  SELECT id FROM public.brands WHERE currency = 'USD'
) AND (currency IS NULL OR currency = '');

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
