-- Create hero_slides table for managing homepage carousel (safe version)
CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  link TEXT,
  hero_title TEXT,
  is_editorial BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security (safe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'hero_slides' 
    AND policyname = 'Everyone can read active hero slides'
  ) THEN
    ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Everyone can read active hero slides"
      ON hero_slides FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

-- Create super admin policy (safe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'hero_slides' 
    AND policyname = 'Super admins can manage hero slides'
  ) THEN
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
  END IF;
END $$;

-- Create trigger function (safe)
CREATE OR REPLACE FUNCTION update_hero_slides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (safe)
DROP TRIGGER IF EXISTS update_hero_slides_updated_at_trigger ON hero_slides;
CREATE TRIGGER update_hero_slides_updated_at_trigger
  BEFORE UPDATE ON hero_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_hero_slides_updated_at();

-- Insert default hero slides only if table is empty
INSERT INTO hero_slides (
  image,
  title,
  subtitle,
  link,
  hero_title,
  is_editorial,
  display_order,
  is_active
) 
SELECT 
  '/lovable-uploads/827fb8c0-e5da-4520-a979-6fc054eefc6e.png',
  'Collections',
  'Shop for an occasion, holiday, or ready to wear piece',
  '/directory?category=Collections',
  'New Season',
  true,
  1,
  true
WHERE NOT EXISTS (SELECT 1 FROM hero_slides LIMIT 1)

UNION ALL

SELECT 
  '/lovable-uploads/bb152c0b-6378-419b-a0e6-eafce44631b2.png',
  'Tailored',
  'Masters of craft creating perfectly fitted garments',
  '/directory?category=Tailored',
  'Bespoke Craft',
  true,
  2,
  true
WHERE NOT EXISTS (SELECT 1 FROM hero_slides LIMIT 1); 