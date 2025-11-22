-- Create pages table for dynamic page management
CREATE TABLE IF NOT EXISTS public.pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  meta_description text,
  is_active boolean NOT NULL DEFAULT true,
  is_system_page boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Admins can manage all pages
CREATE POLICY "Admins can manage pages"
  ON public.pages
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active pages
CREATE POLICY "Anyone can view active pages"
  ON public.pages
  FOR SELECT
  USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();

-- Insert existing system pages
INSERT INTO public.pages (slug, title, meta_description, is_system_page, is_active) VALUES
  ('', 'Accueil', 'Meta Ads Mastery - Formation complète en publicité Facebook', true, true),
  ('about', 'À propos', 'Découvrez Meta Ads Mastery', true, true),
  ('product-demo-videos', 'Études de cas', 'Découvrez nos études de cas vidéo', true, true),
  ('pricing', 'Tarifs', 'Nos offres de formation Meta Ads', true, true),
  ('espace-formation', 'Espace Formation', 'Accédez à vos cours', true, true),
  ('admin', 'Administration', 'Tableau de bord administrateur', true, true),
  ('auth', 'Connexion', 'Authentification', true, true),
  ('merci', 'Merci', 'Page de remerciement', true, true),
  ('case-studies', 'Études de cas', 'Nos réussites clients', true, false),
  ('shorts', 'Shorts', 'Contenu court', true, false),
  ('career', 'Carrières', 'Rejoignez notre équipe', true, false),
  ('privacy-policy', 'Politique de confidentialité', 'Notre politique de confidentialité', true, false),
  ('terms-of-service', 'Conditions d''utilisation', 'Nos conditions d''utilisation', true, false),
  ('cookie-policy', 'Politique des cookies', 'Notre politique des cookies', true, false),
  ('youtube-strategy', 'Stratégie YouTube', 'Stratégie de contenu YouTube', true, false),
  ('youtube-script-generator', 'Générateur de scripts YouTube', 'Outil de génération de scripts', true, false),
  ('script-generator', 'Générateur de scripts', 'Créez vos scripts', true, false),
  ('video-production', 'Production vidéo', 'Services de production', true, false),
  ('creator-led', 'Creator Led', 'Approche creator-led', true, false),
  ('schedule', 'Planifier', 'Planifiez un appel', true, false),
  ('video-growth', 'Croissance vidéo', 'Développez votre audience', true, false),
  ('blog', 'Blog', 'Articles et actualités', true, false)
ON CONFLICT (slug) DO NOTHING;