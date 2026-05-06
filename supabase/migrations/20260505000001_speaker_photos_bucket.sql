-- Speaker Photos Storage Bucket
-- Run this in Supabase SQL Editor after the initial schema migration.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'speaker-photos',
  'speaker-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "speaker_photos_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'speaker-photos');

CREATE POLICY "speaker_photos_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'speaker-photos');

CREATE POLICY "speaker_photos_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'speaker-photos');

CREATE POLICY "speaker_photos_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'speaker-photos');
