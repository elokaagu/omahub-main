-- Allow edition_images.kind = 'video': lets super admins set/replace the
-- edition recap video from Studio instead of editing lib/data/editions.ts.
-- Reuses image_url for the direct video file URL and alt_text (optional)
-- for a thumbnail/poster image URL. Single-item, like 'cover' - a new
-- video replaces the existing one for that edition.
ALTER TABLE edition_images DROP CONSTRAINT IF EXISTS edition_images_kind_check;

ALTER TABLE edition_images
  ADD CONSTRAINT edition_images_kind_check
  CHECK (kind IN ('cover', 'gallery', 'story', 'partner', 'video'));
