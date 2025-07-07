-- Migration script to add existing Tailored brands to the Tailors Directory
-- This script will migrate brands with category "Tailored" to the tailors table

-- First, ensure the tailors table exists
CREATE TABLE IF NOT EXISTS tailors (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    image TEXT NOT NULL,
    description TEXT,
    specialties TEXT[], -- e.g., ['Suits', 'Wedding Dresses', 'Alterations']
    price_range TEXT, -- e.g., '$500-$2000'
    lead_time TEXT, -- e.g., '2-4 weeks'
    consultation_fee DECIMAL(10,2), -- Optional consultation fee
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS if not already enabled
ALTER TABLE tailors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'tailors' 
        AND policyname = 'Allow public read access to tailors'
    ) THEN
        CREATE POLICY "Allow public read access to tailors"
        ON tailors FOR SELECT
        TO public
        USING (true);
    END IF;
END$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tailors_brand_id ON tailors(brand_id);
CREATE INDEX IF NOT EXISTS idx_tailors_created_at ON tailors(created_at);

-- Create updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_tailors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tailors_updated_at ON tailors;
CREATE TRIGGER update_tailors_updated_at
    BEFORE UPDATE ON tailors
    FOR EACH ROW
    EXECUTE FUNCTION update_tailors_updated_at();

-- Now migrate the tailored brands to tailors table
-- Note: Replace the brand_id values with actual IDs from your database

-- First, let's check what tailored brands exist in the database
-- SELECT id, name, category, location FROM brands WHERE category = 'Tailored';

-- Insert Tunis Master Tailors
INSERT INTO tailors (brand_id, title, image, description, specialties, price_range, lead_time, consultation_fee)
SELECT 
    id as brand_id,
    'Bespoke Mediterranean Tailored' as title,
    image,
    'Master tailor specializing in bespoke menswear that blends Mediterranean elegance with North African craftsmanship. Over three decades of excellence in creating impeccably fitted suits, shirts, and formal wear.' as description,
    ARRAY['Bespoke Suits', 'Formal Wear', 'Shirts', 'Mediterranean Style', 'Traditional Tailored'] as specialties,
    'TND 800 - TND 5,000' as price_range,
    '3-4 weeks' as lead_time,
    75.00 as consultation_fee
FROM brands 
WHERE id = 'tunis-tailors' OR name = 'Tunis Master Tailors'
ON CONFLICT (brand_id) DO NOTHING;

-- Insert Casablanca Cuts
INSERT INTO tailors (brand_id, title, image, description, specialties, price_range, lead_time, consultation_fee)
SELECT 
    id as brand_id,
    'Moroccan Bespoke Tailored' as title,
    image,
    'Contemporary bespoke tailored house combining traditional Moroccan craftsmanship with modern techniques. Specializing in both traditional Moroccan garments and contemporary suits with distinctive North African flair.' as description,
    ARRAY['Bespoke Suits', 'Traditional Moroccan Wear', 'Contemporary Menswear', 'Custom Design', 'Alterations'] as specialties,
    'MAD 5,000 - MAD 30,000' as price_range,
    '2-3 weeks' as lead_time,
    100.00 as consultation_fee
FROM brands 
WHERE id = 'casablanca-cuts' OR name = 'Casablanca Cuts'
ON CONFLICT (brand_id) DO NOTHING;

-- Verify the migration
SELECT 
    t.id,
    t.title,
    b.name as brand_name,
    b.location,
    t.specialties,
    t.price_range,
    t.lead_time
FROM tailors t
JOIN brands b ON t.brand_id = b.id
WHERE b.category = 'Tailored';

-- Optional: Add more sample tailors for demonstration
-- You can uncomment these if you want additional sample data

/*
-- Add a sample tailor for a bridal brand (if you have bridal brands)
INSERT INTO tailors (brand_id, title, image, description, specialties, price_range, lead_time, consultation_fee)
SELECT 
    id as brand_id,
    'Bridal Couture & Custom Gowns' as title,
    image,
    'Exquisite bridal couture and custom wedding dress design, creating dream gowns for your special day with meticulous attention to detail and personalized service.' as description,
    ARRAY['Wedding Dresses', 'Bridal Wear', 'Evening Gowns', 'Custom Design', 'Alterations'] as specialties,
    'Varies by design' as price_range,
    '6-8 weeks' as lead_time,
    150.00 as consultation_fee
FROM brands 
WHERE category = 'Bridal' 
LIMIT 1
ON CONFLICT (brand_id) DO NOTHING;
*/ 