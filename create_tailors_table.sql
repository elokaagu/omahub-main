-- Create tailors table
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

-- Enable RLS
ALTER TABLE tailors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access to tailors"
ON tailors FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow API to create tailors"
ON tailors FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow API to update tailors"
ON tailors FOR UPDATE
TO public
USING (true);

CREATE POLICY "Allow API to delete tailors"
ON tailors FOR DELETE
TO public
USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tailors_brand_id ON tailors(brand_id);
CREATE INDEX IF NOT EXISTS idx_tailors_created_at ON tailors(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_tailors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tailors_updated_at
    BEFORE UPDATE ON tailors
    FOR EACH ROW
    EXECUTE FUNCTION update_tailors_updated_at();

-- Insert some sample data (you'll need to replace brand_ids with actual brand IDs from your database)
-- First, let's see what brands exist:
-- SELECT id, name, category FROM brands WHERE category IN ('Tailoring', 'Bridal') LIMIT 5;

-- Sample tailors data (uncomment and modify brand_ids as needed):
/*
INSERT INTO tailors (brand_id, title, image, description, specialties, price_range, lead_time, consultation_fee) VALUES
(
    'your-brand-id-1', 
    'Bespoke Suits & Formal Wear',
    '/lovable-uploads/99ca757a-bed8-422e-b155-0b9d365b58e0.png',
    'Master tailor specializing in custom suits, formal wear, and alterations with over 20 years of experience.',
    ARRAY['Suits', 'Formal Wear', 'Alterations', 'Tuxedos'],
    '$800-$3000',
    '3-4 weeks',
    50.00
),
(
    'your-brand-id-2',
    'Bridal Couture & Wedding Dresses',
    '/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png',
    'Exquisite bridal couture and custom wedding dress design for your special day.',
    ARRAY['Wedding Dresses', 'Bridal Wear', 'Evening Gowns', 'Alterations'],
    '$1500-$5000',
    '6-8 weeks',
    100.00
),
(
    'your-brand-id-3',
    'Traditional & Contemporary Tailoring',
    '/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png',
    'Blending traditional craftsmanship with contemporary design for unique, perfectly fitted garments.',
    ARRAY['Traditional Wear', 'Contemporary Fashion', 'Casual Wear', 'Business Attire'],
    '$400-$1500',
    '2-3 weeks',
    25.00
);
*/ 