-- Create hero_slides table for managing homepage carousel
CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  image TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  link TEXT,
  hero_title TEXT,
  is_editorial BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can read active hero slides"
  ON hero_slides FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admins can manage hero slides"
  ON hero_slides FOR ALL
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
CREATE OR REPLACE FUNCTION update_hero_slides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hero_slides_updated_at_trigger
  BEFORE UPDATE ON hero_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_hero_slides_updated_at();

-- Insert default hero slides (current hardcoded carousel data)
INSERT INTO hero_slides (
  image,
  title,
  subtitle,
  link,
  hero_title,
  is_editorial,
  display_order,
  is_active
) VALUES 
(
  '/lovable-uploads/827fb8c0-e5da-4520-a979-6fc054eefc6e.png',
  'Collections',
  'Shop for an occasion, holiday, or ready to wear piece',
  '/directory?category=Collections',
  'New Season',
  true,
  1,
  true
),
(
  '/lovable-uploads/bb152c0b-6378-419b-a0e6-eafce44631b2.png',
  'Tailored',
  'Masters of craft creating perfectly fitted garments',
  '/directory?category=Tailored',
  'Bespoke Craft',
  true,
  2,
  true
); 