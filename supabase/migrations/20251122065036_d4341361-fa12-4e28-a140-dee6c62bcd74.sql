-- Create landing_page_sections table to store all sections configuration
CREATE TABLE IF NOT EXISTS public.landing_page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type TEXT NOT NULL, -- 'hero', 'services', 'testimonials', 'faq', 'cta', 'contact', 'video', 'text'
  section_key TEXT NOT NULL UNIQUE, -- unique identifier for each section
  title TEXT,
  subtitle TEXT,
  content JSONB, -- flexible storage for section-specific data
  styles JSONB, -- colors, backgrounds, fonts, etc.
  media_url TEXT, -- for videos, images
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_page_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active sections"
  ON public.landing_page_sections
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage all sections"
  ON public.landing_page_sections
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for ordering
CREATE INDEX idx_landing_sections_order ON public.landing_page_sections(order_index);

-- Insert default sections based on current Index page structure
INSERT INTO public.landing_page_sections (section_key, section_type, title, subtitle, content, styles, order_index, is_active) VALUES
('hero', 'hero', 
 'Maîtrisez les Meta Ads et Transformez Votre Business', 
 'Formation complète de A à Z pour réussir vos publicités Facebook et Instagram',
 '{"cta_text": "Commencer Maintenant", "video_id": "your_wistia_id"}'::jsonb,
 '{"background": "cinematic-section", "text_color": "text-white"}'::jsonb,
 1, true),

('services', 'services',
 'Ce Que Vous Allez Apprendre',
 'Une formation complète pour maîtriser Meta Ads',
 '{"items": []}'::jsonb,
 '{"background": "bg-background"}'::jsonb,
 2, true),

('testimonials', 'testimonials',
 'Ce Que Disent Nos Étudiants',
 'Des résultats concrets et mesurables',
 '{"items": []}'::jsonb,
 '{"background": "cinematic-section"}'::jsonb,
 3, true),

('faq', 'faq',
 'Questions Fréquentes',
 'Toutes les réponses à vos questions',
 '{"items": []}'::jsonb,
 '{"background": "bg-background"}'::jsonb,
 4, true),

('pricing_cta', 'cta',
 'Prêt à Transformer Votre Activité ?',
 'Rejoignez des centaines d''entrepreneurs qui ont déjà transformé leur business',
 '{"price_original": "229", "price_promo": "49.99", "cta_text": "Je M''Inscris Maintenant"}'::jsonb,
 '{"background": "cinematic-section", "text_color": "text-white"}'::jsonb,
 5, true),

('contact', 'contact',
 'Des Questions ? Contactez-Nous',
 'Notre équipe est là pour vous aider',
 '{}'::jsonb,
 '{"background": "bg-background"}'::jsonb,
 6, true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_landing_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER update_landing_sections_timestamp
  BEFORE UPDATE ON public.landing_page_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_landing_sections_updated_at();