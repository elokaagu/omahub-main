-- Fix missing product columns for services and portfolio functionality
-- This migration adds the missing columns that the Studio forms are trying to use

-- Add missing columns for services and portfolio functionality
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS contact_for_pricing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS specialties TEXT[],
ADD COLUMN IF NOT EXISTS consultation_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_range TEXT,
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS fixed_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS duration TEXT,
ADD COLUMN IF NOT EXISTS sessions_included TEXT,
ADD COLUMN IF NOT EXISTS requirements TEXT,
ADD COLUMN IF NOT EXISTS measurement_guide TEXT,
ADD COLUMN IF NOT EXISTS fitting_sessions TEXT,
ADD COLUMN IF NOT EXISTS delivery_method TEXT,
ADD COLUMN IF NOT EXISTS includes TEXT[],
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add comments for documentation
COMMENT ON COLUMN products.contact_for_pricing IS 'Whether to show "Contact for pricing" instead of a specific price';
COMMENT ON COLUMN products.specialties IS 'Array of specialties for tailor services';
COMMENT ON COLUMN products.consultation_fee IS 'Consultation fee for services';
COMMENT ON COLUMN products.price_range IS 'Price range display text (e.g., "$100 - $500")';
COMMENT ON COLUMN products.hourly_rate IS 'Hourly rate for services';
COMMENT ON COLUMN products.fixed_price IS 'Fixed price for services';
COMMENT ON COLUMN products.duration IS 'Duration of service';
COMMENT ON COLUMN products.sessions_included IS 'Number of sessions included';
COMMENT ON COLUMN products.requirements IS 'Requirements for the service';
COMMENT ON COLUMN products.measurement_guide IS 'Measurement guide for customers';
COMMENT ON COLUMN products.fitting_sessions IS 'Number of fitting sessions';
COMMENT ON COLUMN products.delivery_method IS 'Delivery method for services';
COMMENT ON COLUMN products.includes IS 'What is included in the service';
COMMENT ON COLUMN products.created_by IS 'User who created this product';

-- Update existing products to have sensible defaults
UPDATE products 
SET contact_for_pricing = false 
WHERE contact_for_pricing IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_contact_for_pricing ON products(contact_for_pricing);
CREATE INDEX IF NOT EXISTS idx_products_specialties ON products USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_products_consultation_fee ON products(consultation_fee);
CREATE INDEX IF NOT EXISTS idx_products_hourly_rate ON products(hourly_rate);
CREATE INDEX IF NOT EXISTS idx_products_fixed_price ON products(fixed_price);
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by);
CREATE INDEX IF NOT EXISTS idx_products_includes ON products USING GIN(includes);

-- Verify the changes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN (
    'contact_for_pricing', 'specialties', 'consultation_fee', 'price_range',
    'hourly_rate', 'fixed_price', 'duration', 'sessions_included',
    'requirements', 'measurement_guide', 'fitting_sessions', 'delivery_method',
    'includes', 'created_by'
  )
ORDER BY column_name;
