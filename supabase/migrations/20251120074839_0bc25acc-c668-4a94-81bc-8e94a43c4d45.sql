-- Corriger la politique de sécurité sur user_roles pour vérifier explicitement l'authentification

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Créer une nouvelle politique avec vérification d'authentification explicite
CREATE POLICY "Authenticated users can view their own roles"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
);