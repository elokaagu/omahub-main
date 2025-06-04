-- Fix products table schema by adding missing columns
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add missing columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS materials TEXT[],
ADD COLUMN IF NOT EXISTS care_instructions TEXT,
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lead_time TEXT,
ADD COLUMN IF NOT EXISTS images TEXT[];

-- Update the table to ensure all columns exist with proper defaults
UPDATE public.products 
SET 
  materials = COALESCE(materials, '{}'),
  is_custom = COALESCE(is_custom, false)
WHERE materials IS NULL OR is_custom IS NULL;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position; 