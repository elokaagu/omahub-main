-- Edition images: lets super admins add/remove cover and gallery photos for
-- each editorial archive event (edition data itself stays in lib/data/editions.ts;
-- this table only overlays admin-managed photos on top of it).
CREATE TABLE IF NOT EXISTS edition_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  edition_slug TEXT NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('cover', 'gallery')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS edition_images_slug_idx ON edition_images (edition_slug);

ALTER TABLE edition_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read edition images"
  ON edition_images FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage edition images"
  ON edition_images FOR ALL
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

CREATE OR REPLACE FUNCTION update_edition_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_edition_images_updated_at_trigger
  BEFORE UPDATE ON edition_images
  FOR EACH ROW
  EXECUTE FUNCTION update_edition_images_updated_at();
