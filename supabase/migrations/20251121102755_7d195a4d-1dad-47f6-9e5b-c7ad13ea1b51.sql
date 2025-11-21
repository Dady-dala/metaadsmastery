-- Créer un bucket public pour les logos de certificats
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificate-logos', 'certificate-logos', true);

-- RLS policies pour le bucket certificate-logos
CREATE POLICY "Admins can upload logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'certificate-logos' AND
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'certificate-logos' AND
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'certificate-logos' AND
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Anyone can view logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'certificate-logos');