-- Ajouter un champ pour la signature du formateur
ALTER TABLE public.certificate_settings 
ADD COLUMN trainer_signature_url text;