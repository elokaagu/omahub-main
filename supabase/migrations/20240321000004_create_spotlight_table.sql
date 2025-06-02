-- Create spotlight content table
CREATE TABLE spotlight_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  brand_description TEXT NOT NULL,
  brand_quote TEXT NOT NULL,
  brand_quote_author TEXT NOT NULL,
  main_image TEXT NOT NULL,
  featured_products JSONB DEFAULT '[]'::jsonb,
  brand_link TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE spotlight_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can read active spotlight content"
  ON spotlight_content FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admins can manage spotlight content"
  ON spotlight_content FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role::text = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role::text = 'super_admin'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_spotlight_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_spotlight_updated_at_trigger
  BEFORE UPDATE ON spotlight_content
  FOR EACH ROW
  EXECUTE FUNCTION update_spotlight_updated_at();

-- Insert default spotlight content (current Mbali Studio content)
INSERT INTO spotlight_content (
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
) VALUES (
  'Spotlight On: Mbali Studio',
  'Where tradition meets modern edge each piece tells a story you''ll want to wear.',
  'Mbali Studio',
  'Founded in 2018 by textile artist Thandi Mbali, this Johannesburg based studio has quickly become known for its luxurious silk pieces featuring contemporary interpretations of traditional African patterns. Each piece tells a story of cultural heritage while embracing modern silhouettes and sustainable production methods, making it a favorite among conscious fashion enthusiasts across the continent.',
  'Where elegance comes stitched with meaning.',
  'Thandi Mbali, Founder',
  '/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png',
  '[
    {
      "name": "Silk Scarf",
      "collection": "Heritage Collection",
      "image": "/lovable-uploads/53ab4ec9-fd54-4aa8-a292-70669af33185.png"
    },
    {
      "name": "Silk Dress",
      "collection": "Summer ''24 Collection",
      "image": "/lovable-uploads/eca14925-7de8-4100-af5d-b158ff70e951.png"
    },
    {
      "name": "Silk Top",
      "collection": "Essential Series",
      "image": "/lovable-uploads/023ba098-0109-4738-9baf-1321bc3d2fe1.png"
    },
    {
      "name": "Silk Pants",
      "collection": "Limited Edition",
      "image": "/lovable-uploads/840e541a-b4c1-4e59-94af-89c8345e4d2d.png"
    }
  ]'::jsonb,
  '/brand/mbali-studio',
  true
); 