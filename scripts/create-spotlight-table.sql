-- Create spotlight_content table if it doesn't exist
-- This ensures the spotlight section can work even without video support migration

CREATE TABLE IF NOT EXISTS spotlight_content (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  brand_description TEXT NOT NULL,
  brand_quote TEXT NOT NULL,
  brand_quote_author TEXT NOT NULL,
  main_image TEXT NOT NULL,
  video_url TEXT,
  video_thumbnail TEXT,
  video_type TEXT CHECK (video_type IN ('brand_campaign', 'behind_scenes', 'interview', 'product_demo')),
  video_description TEXT,
  featured_products JSONB DEFAULT '[]'::JSONB,
  brand_link TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE spotlight_content ENABLE ROW LEVEL SECURITY;

-- Create policies for spotlight_content
DROP POLICY IF EXISTS "Allow public read access to spotlight_content" ON spotlight_content;
CREATE POLICY "Allow public read access to spotlight_content" 
  ON spotlight_content FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage spotlight_content" ON spotlight_content;
CREATE POLICY "Allow authenticated users to manage spotlight_content" 
  ON spotlight_content FOR ALL 
  TO authenticated 
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spotlight_content_is_active ON spotlight_content(is_active);
CREATE INDEX IF NOT EXISTS idx_spotlight_content_created_at ON spotlight_content(created_at DESC);

-- Insert sample spotlight content if table is empty
INSERT INTO spotlight_content (
  id,
  title,
  subtitle,
  brand_name,
  brand_description,
  brand_quote,
  brand_quote_author,
  main_image,
  featured_products,
  brand_link,
  is_active
)
SELECT 
  'sample-spotlight-homepage',
  'Featured Designer Collection',
  'Discover exceptional craftsmanship and unique designs',
  'Featured Designer',
  'A leading fashion house creating timeless pieces that blend contemporary style with traditional African craftsmanship. Each piece tells a story of heritage and innovation.',
  'Fashion is art you can wear, and every piece should tell your unique story.',
  'Design Team',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=800&fit=crop',
  '[
    {
      "name": "Elegant Evening Dress",
      "collection": "Signature Collection", 
      "image": "https://images.unsplash.com/photo-1566479179817-c0b5b4b4b1e5?w=400&h=300&fit=crop"
    },
    {
      "name": "Contemporary Blazer",
      "collection": "Professional Line",
      "image": "https://images.unsplash.com/photo-1594736797933-d0acc4d1dd4f?w=400&h=300&fit=crop"
    },
    {
      "name": "Cultural Fusion Dress", 
      "collection": "Heritage Collection",
      "image": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=300&fit=crop"
    },
    {
      "name": "Statement Accessories",
      "collection": "Accessories Line",
      "image": "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=300&fit=crop"
    }
  ]'::JSONB,
  '/directory',
  true
WHERE NOT EXISTS (SELECT 1 FROM spotlight_content);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_spotlight_content_updated_at ON spotlight_content;
CREATE TRIGGER update_spotlight_content_updated_at
    BEFORE UPDATE ON spotlight_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Show final status
SELECT 
  COUNT(*) as total_spotlight_content,
  COUNT(*) FILTER (WHERE is_active = true) as active_spotlight_content
FROM spotlight_content; 