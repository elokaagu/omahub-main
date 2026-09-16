-- Allow Studio to override the public "Edition 01" label.
ALTER TABLE edition_content
  ADD COLUMN IF NOT EXISTS edition_number TEXT;
