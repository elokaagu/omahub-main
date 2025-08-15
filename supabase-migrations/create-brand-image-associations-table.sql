-- Create brand image associations table
-- This table will track explicit relationships between brands and their images
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS brand_image_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE,
  image_filename TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_description TEXT,
  assigned_by TEXT DEFAULT 'system',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_brand_image_assignments_brand_id ON brand_image_assignments(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_image_assignments_image_filename ON brand_image_assignments(image_filename);
CREATE INDEX IF NOT EXISTS idx_brand_image_assignments_verified ON brand_image_assignments(is_verified);

-- Add unique constraint to prevent duplicate assignments
ALTER TABLE brand_image_assignments ADD CONSTRAINT unique_brand_image UNIQUE (brand_id, image_filename);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brand_image_assignments_updated_at 
    BEFORE UPDATE ON brand_image_assignments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
GRANT ALL ON brand_image_assignments TO authenticated;
GRANT ALL ON brand_image_assignments TO service_role;
