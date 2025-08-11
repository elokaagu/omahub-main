-- Add portfolio support to products table
-- This allows tailors to showcase their work without individual pricing

-- Add portfolio-specific fields
ALTER TABLE products 
ADD COLUMN materials TEXT[],
ADD COLUMN techniques TEXT[],
ADD COLUMN inspiration TEXT;

-- Add comments for documentation
COMMENT ON COLUMN products.materials IS 'Array of materials the tailor works with';
COMMENT ON COLUMN products.techniques IS 'Array of techniques the tailor specializes in';
COMMENT ON COLUMN products.inspiration IS 'Design inspiration and style notes';

-- Update existing service_type constraint to include 'portfolio'
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_service_type_check;
ALTER TABLE products ADD CONSTRAINT products_service_type_check 
CHECK (service_type IN ('product', 'service', 'consultation', 'portfolio'));

-- Add index for portfolio queries
CREATE INDEX IF NOT EXISTS idx_products_service_type ON products(service_type);
CREATE INDEX IF NOT EXISTS idx_products_portfolio_brand ON products(brand_id) WHERE service_type = 'portfolio';
