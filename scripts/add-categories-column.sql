-- Add categories column to brands table to support multiple categories
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- Update existing brands to populate categories array from single category
UPDATE public.brands 
SET categories = ARRAY[category] 
WHERE categories = '{}' AND category IS NOT NULL;

-- Create index for better performance when filtering by categories
CREATE INDEX IF NOT EXISTS idx_brands_categories ON public.brands USING GIN (categories);

-- Verify the migration
SELECT id, name, category, categories FROM public.brands LIMIT 5; 