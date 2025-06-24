-- Create collection_images table for storing multiple images per collection
CREATE TABLE IF NOT EXISTS collection_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_collection_images_collection_id ON collection_images(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_images_display_order ON collection_images(collection_id, display_order);

-- Enable RLS on collection_images
ALTER TABLE collection_images ENABLE ROW LEVEL SECURITY;

-- Create policies for collection_images
CREATE POLICY "Allow public read access to collection_images" 
  ON collection_images FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to manage collection_images" 
  ON collection_images FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Add description column to collections table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'collections' AND column_name = 'description'
  ) THEN
    ALTER TABLE collections ADD COLUMN description TEXT;
  END IF;
END $$;

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_collection_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collection_images_updated_at_trigger
  BEFORE UPDATE ON collection_images
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_images_updated_at(); 