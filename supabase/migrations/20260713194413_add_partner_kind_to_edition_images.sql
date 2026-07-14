-- Allow edition_images.kind = 'partner': logos shown in a "Partners" strip
-- under each edition (alt_text holds the partner's name).
ALTER TABLE edition_images DROP CONSTRAINT IF EXISTS edition_images_kind_check;

ALTER TABLE edition_images
  ADD CONSTRAINT edition_images_kind_check
  CHECK (kind IN ('cover', 'gallery', 'story', 'partner'));
