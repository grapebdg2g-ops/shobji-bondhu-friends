-- Create exchange-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('exchange-images', 'exchange-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Exchange images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'exchange-images');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload own exchange images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exchange-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own exchange images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'exchange-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own exchange images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exchange-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);