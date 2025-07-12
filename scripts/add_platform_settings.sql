-- Create platform_settings table for site-wide editable settings
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default About OmaHub text if not present
INSERT INTO platform_settings (key, value)
VALUES (
  'about_omahub',
  'OmaHub is a premier fashion tech platform dedicated to spotlighting Africa''s emerging designers. We''re creating a digital space where creativity, craftsmanship, and cultural expression intersect.\n\nOur mission is to connect Africa''s innovative fashion talent with a global audience, fostering discovery and celebration of the continent''s rich design heritage.'
)
ON CONFLICT (key) DO NOTHING; 