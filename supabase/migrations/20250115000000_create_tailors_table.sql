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