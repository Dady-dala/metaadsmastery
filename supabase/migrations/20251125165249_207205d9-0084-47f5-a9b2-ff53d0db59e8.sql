-- Ajouter une colonne action_type sur la table forms pour définir le comportement
ALTER TABLE public.forms ADD COLUMN action_type TEXT NOT NULL DEFAULT 'submission';

-- Ajouter une colonne mapping_config sur la table forms pour mapper les champs aux colonnes de contacts
ALTER TABLE public.forms ADD COLUMN mapping_config JSONB DEFAULT '{}';

-- Ajouter un commentaire explicatif
COMMENT ON COLUMN public.forms.action_type IS 'Type d''action: submission (soumission simple), contact (créer un contact), both (les deux)';
COMMENT ON COLUMN public.forms.mapping_config IS 'Configuration de mapping des champs du formulaire vers les colonnes de la table contacts';

-- Migrer les prospects de contact_submissions vers contacts
INSERT INTO public.contacts (email, first_name, last_name, phone, source, status, notes, metadata, created_at)
SELECT 
  cs.email,
  cs.first_name,
  cs.last_name,
  cs.phone_number,
  'registration_form' as source,
  'active' as status,
  'Prospect migré depuis formulaire d''inscription' as notes,
  jsonb_build_object('original_submission_id', cs.id, 'submission_date', cs.created_at) as metadata,
  cs.created_at
FROM public.contact_submissions cs
WHERE NOT EXISTS (
  SELECT 1 FROM public.contacts c WHERE c.email = cs.email
)
ON CONFLICT (email) DO NOTHING;

-- Migrer les utilisateurs (profiles) vers contacts
INSERT INTO public.contacts (email, first_name, last_name, source, status, notes, metadata, created_at, created_by)
SELECT 
  au.email,
  p.first_name,
  p.last_name,
  'user_account' as source,
  'active' as status,
  'Utilisateur avec compte créé' as notes,
  jsonb_build_object('user_id', p.user_id, 'profile_id', p.id, 'role', ur.role) as metadata,
  p.created_at,
  p.user_id
FROM public.profiles p
JOIN auth.users au ON au.id = p.user_id
LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
WHERE au.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.contacts c WHERE c.email = au.email
  )
ON CONFLICT (email) DO NOTHING;