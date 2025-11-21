-- Ajouter des champs au profil étudiant
ALTER TABLE public.profiles 
ADD COLUMN date_of_birth date,
ADD COLUMN gender text CHECK (gender IN ('homme', 'femme', 'autre', 'non-specifie'));

-- Créer une table pour les paramètres de certificat
CREATE TABLE public.certificate_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_color text NOT NULL DEFAULT '#6B21A8',
  accent_color text NOT NULL DEFAULT '#22C55E',
  background_color text NOT NULL DEFAULT '#1A0B2E',
  organization_name text NOT NULL DEFAULT 'Meta Ads Mastery',
  organization_subtitle text NOT NULL DEFAULT 'Formation professionnelle en publicité Meta',
  trainer_name text NOT NULL DEFAULT 'Formateur Expert',
  certificate_title text NOT NULL DEFAULT 'CERTIFICAT DE RÉUSSITE',
  logo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Activer RLS sur certificate_settings
ALTER TABLE public.certificate_settings ENABLE ROW LEVEL SECURITY;

-- Politique : les admins peuvent tout gérer
CREATE POLICY "Admins can manage certificate settings"
ON public.certificate_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Politique : tout le monde peut lire les paramètres (pour générer les certificats)
CREATE POLICY "Anyone can view certificate settings"
ON public.certificate_settings
FOR SELECT
USING (true);

-- Insérer des paramètres par défaut
INSERT INTO public.certificate_settings (
  primary_color,
  accent_color,
  background_color,
  organization_name,
  organization_subtitle,
  trainer_name,
  certificate_title
) VALUES (
  '#6B21A8',
  '#22C55E',
  '#1A0B2E',
  'Meta Ads Mastery',
  'Formation professionnelle en publicité Meta',
  'Formateur Expert',
  'CERTIFICAT DE RÉUSSITE'
);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_certificate_settings_updated_at
BEFORE UPDATE ON public.certificate_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();