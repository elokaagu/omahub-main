-- Fix basket table constraints
-- This script makes brand_id nullable and ensures proper table structure

-- Make brand_id nullable in baskets table
ALTER TABLE public.baskets 
ALTER COLUMN brand_id DROP NOT NULL;

-- Add a comment explaining the change
COMMENT ON COLUMN public.baskets.brand_id IS 'Brand ID is optional - users can have general baskets or brand-specific baskets';

-- Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'baskets' AND column_name = 'brand_id';

-- Ensure proper foreign key constraints
-- Drop existing constraint if it exists
ALTER TABLE public.baskets 
DROP CONSTRAINT IF EXISTS baskets_brand_id_fkey;

-- Add proper foreign key constraint with CASCADE
ALTER TABLE public.baskets 
ADD CONSTRAINT baskets_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;

-- Verify the table structure
\d public.baskets
