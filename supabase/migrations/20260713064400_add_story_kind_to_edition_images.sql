-- Allow edition_images.kind = 'story': photos an admin can place between
-- paragraphs of an edition's story (display_order holds the 0-indexed
-- paragraph the photo follows), alongside the existing cover/gallery kinds.
ALTER TABLE edition_images DROP CONSTRAINT IF EXISTS edition_images_kind_check;

ALTER TABLE edition_images
  ADD CONSTRAINT edition_images_kind_check
  CHECK (kind IN ('cover', 'gallery', 'story'));
