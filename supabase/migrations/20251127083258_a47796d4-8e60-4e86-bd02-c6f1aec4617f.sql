-- Créer le bucket pour les preuves sociales
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'social-proof',
  'social-proof',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Policy: Admins peuvent uploader des images
CREATE POLICY "Admins can upload social proof images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'social-proof' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

-- Policy: Admins peuvent mettre à jour des images
CREATE POLICY "Admins can update social proof images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'social-proof' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

-- Policy: Admins peuvent supprimer des images
CREATE POLICY "Admins can delete social proof images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'social-proof' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

-- Policy: Tout le monde peut voir les images (bucket public)
CREATE POLICY "Anyone can view social proof images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'social-proof');