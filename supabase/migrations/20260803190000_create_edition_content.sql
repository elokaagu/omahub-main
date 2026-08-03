-- Studio-managed edition copy and metadata (story, excerpt, event details).
-- Slugs match lib/data/editions.ts; static data remains the fallback until saved here.
CREATE TABLE IF NOT EXISTS edition_content (
  edition_slug TEXT PRIMARY KEY,
  title TEXT,
  card_title TEXT,
  excerpt TEXT,
  story_html TEXT,
  status TEXT CHECK (status IN ('past', 'upcoming')),
  date_label TEXT,
  sort_date DATE,
  city TEXT,
  country TEXT,
  venue TEXT,
  partner TEXT,
  lineup_label TEXT,
  applications_open BOOLEAN DEFAULT false,
  theme_announced BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS edition_content_sort_date_idx
  ON edition_content (sort_date DESC NULLS LAST);

ALTER TABLE edition_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read edition content"
  ON edition_content FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage edition content"
  ON edition_content FOR ALL
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

CREATE OR REPLACE FUNCTION update_edition_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_edition_content_updated_at_trigger
  BEFORE UPDATE ON edition_content
  FOR EACH ROW
  EXECUTE FUNCTION update_edition_content_updated_at();
