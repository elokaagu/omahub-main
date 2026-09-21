-- Edition Studio cover, gallery, partner, story, and video files all upload
-- to `edition-galleries`. Align size/MIME with the live bucket and ensure
-- authenticated users can insert (client uploads previously failed RLS).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'edition-galleries',
  'edition-galleries',
  true,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/pjpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "edition-galleries_public_select" ON storage.objects;
DROP POLICY IF EXISTS "edition-galleries_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "edition-galleries_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "edition-galleries_auth_delete" ON storage.objects;

CREATE POLICY "edition-galleries_public_select"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'edition-galleries');

CREATE POLICY "edition-galleries_auth_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'edition-galleries');

CREATE POLICY "edition-galleries_auth_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'edition-galleries')
WITH CHECK (bucket_id = 'edition-galleries');

CREATE POLICY "edition-galleries_auth_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'edition-galleries');
