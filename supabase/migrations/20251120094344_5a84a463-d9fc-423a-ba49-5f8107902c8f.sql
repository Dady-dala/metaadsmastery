-- Corriger la politique de sécurité sur contact_submissions pour vérifier explicitement l'authentification

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Only admins can view contact submissions" ON public.contact_submissions;

-- Créer une nouvelle politique avec vérification d'authentification explicite
CREATE POLICY "Only authenticated admins can view contact submissions"
ON public.contact_submissions
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin'::app_role)
);