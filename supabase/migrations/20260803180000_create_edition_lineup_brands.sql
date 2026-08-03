-- Brands that showed at each edition — managed in Studio, rendered as the
-- scrolling brand row at the bottom of edition archive pages.
CREATE TABLE IF NOT EXISTS edition_lineup_brands (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  edition_slug TEXT NOT NULL,
  brand_id UUID NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE (edition_slug, brand_id)
);

CREATE INDEX IF NOT EXISTS edition_lineup_brands_slug_idx
  ON edition_lineup_brands (edition_slug);

CREATE INDEX IF NOT EXISTS edition_lineup_brands_brand_idx
  ON edition_lineup_brands (brand_id);

ALTER TABLE edition_lineup_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read edition lineup brands"
  ON edition_lineup_brands FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage edition lineup brands"
  ON edition_lineup_brands FOR ALL
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

CREATE OR REPLACE FUNCTION update_edition_lineup_brands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_edition_lineup_brands_updated_at_trigger
  BEFORE UPDATE ON edition_lineup_brands
  FOR EACH ROW
  EXECUTE FUNCTION update_edition_lineup_brands_updated_at();
