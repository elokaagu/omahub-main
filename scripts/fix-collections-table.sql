-- Fix collections table to match application requirements
-- Drop existing table if it exists and recreate with proper schema

DROP TABLE IF EXISTS collections CASCADE;

-- Create collections table with string ID and description field
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  image TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Create policies for collections
CREATE POLICY "Allow public read access to collections" 
  ON collections FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to create collections" 
  ON collections FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update collections" 
  ON collections FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to delete collections" 
  ON collections FOR DELETE 
  TO authenticated 
  USING (true);

-- Insert some sample collections for existing brands
INSERT INTO collections (id, brand_id, title, image, description) VALUES
('detty-december', 'ehbs-couture', 'Detty December', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=800&fit=crop', 'A festive collection perfect for the holiday season'),
('summer-vibes', 'ehbs-couture', 'Summer Vibes', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=800&fit=crop', 'Light and breezy pieces for the summer season'),
('elegant-evenings', 'ehbs-couture', 'Elegant Evenings', 'https://images.unsplash.com/photo-1566479179817-c0b5b4b4b1e5?w=800&h=800&fit=crop', 'Sophisticated pieces for special occasions'); 