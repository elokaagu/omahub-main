-- Migration: Add product-level categories support
-- This migration adds a categories array column to products table for flexible product categorization

-- Add categories array column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.products.categories IS 'Array of product-specific categories (e.g., "Vacation", "Resort", "Casual")';

-- Create index for better performance on category queries
CREATE INDEX IF NOT EXISTS idx_products_categories ON public.products USING GIN(categories);

-- Update existing products to have categories based on their current category field
-- This ensures backward compatibility
UPDATE public.products 
SET categories = ARRAY[category] 
WHERE categories IS NULL OR array_length(categories, 1) IS NULL;

-- Add a function to search products by categories
CREATE OR REPLACE FUNCTION search_products_by_categories(search_categories TEXT[])
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  price DECIMAL(10,2),
  brand_id TEXT,
  categories TEXT[],
  category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.price,
    p.brand_id,
    p.categories,
    p.category
  FROM public.products p
  WHERE p.categories && search_categories  -- Check if arrays overlap
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION search_products_by_categories(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION search_products_by_categories(TEXT[]) TO anon;

-- Verify the changes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('categories', 'category')
ORDER BY column_name;
