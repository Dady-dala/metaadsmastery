-- Supprimer la politique INSERT publique qui expose la table
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;

-- Créer une nouvelle politique qui n'autorise que les insertions via service role (Edge Function)
CREATE POLICY "Only service role can insert contact submissions"
ON public.contact_submissions
FOR INSERT
WITH CHECK (false);

-- Note: L'Edge Function utilisera la clé service_role pour contourner cette restriction