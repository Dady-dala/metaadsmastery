-- Create email_templates table for admin customization
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  subject text NOT NULL,
  content jsonb NOT NULL,
  variables jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active templates (for Edge Functions)
CREATE POLICY "Anyone can view active email templates"
  ON public.email_templates
  FOR SELECT
  USING (is_active = true);

-- Policy: Only admins can manage templates
CREATE POLICY "Admins can manage email templates"
  ON public.email_templates
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();

-- Insert default templates
INSERT INTO public.email_templates (template_key, subject, content, variables) VALUES
(
  'confirmation_email',
  'Bienvenue chez Meta Ads Mastery ! 🚀',
  '{
    "header_title": "Félicitations !",
    "header_subtitle": "Vous êtes à un pas de transformer votre activité avec Meta Ads",
    "greeting": "Nous sommes ravis de vous accueillir ! Vous avez pris la meilleure décision pour maîtriser la publicité Meta et développer votre business.",
    "promise_title": "Notre Promesse",
    "promise_items": [
      "Créer et gérer des campagnes publicitaires Meta performantes",
      "Cibler précisément votre audience pour maximiser vos conversions",
      "Optimiser vos budgets publicitaires pour un ROI optimal",
      "Analyser vos résultats et prendre des décisions data-driven"
    ],
    "next_step_title": "Prochaine Étape Importante",
    "next_step_text": "Pour finaliser votre inscription et accéder immédiatement à la formation, rejoignez notre groupe WhatsApp privé :",
    "cta_text": "Rejoindre le Groupe WhatsApp 💬",
    "waiting_title": "Ce qui vous attend",
    "waiting_text": "Une formation complète, pratique et accessible 24/7 pour maîtriser Meta Ads de A à Z, avec un accompagnement personnalisé et des bonus exclusifs."
  }'::jsonb,
  '["firstName", "lastName", "email"]'::jsonb
),
(
  'admin_notification_submission',
  '🎓 Nouvelle inscription à Meta Ads Mastery',
  '{
    "title": "Nouvelle Inscription",
    "intro": "Un nouveau prospect s''est inscrit à Meta Ads Mastery :",
    "action_required": "Le prospect a reçu un email de confirmation avec le lien du groupe WhatsApp."
  }'::jsonb,
  '["firstName", "lastName", "email", "phoneNumber"]'::jsonb
),
(
  'admin_notification_message',
  '💬 Nouveau message de contact',
  '{
    "title": "Nouveau Message",
    "intro": "Vous avez reçu un nouveau message via le formulaire de contact :",
    "action_required": "Répondez à ce message via l''email du contact."
  }'::jsonb,
  '["name", "email", "message"]'::jsonb
),
(
  'course_assignment',
  'Vous avez accès à une nouvelle formation ! 🎓',
  '{
    "header_title": "Nouvelle Formation Débloquée !",
    "header_subtitle": "Vous avez maintenant accès à une nouvelle formation",
    "intro": "Excellente nouvelle ! Vous avez été inscrit(e) à la formation suivante :",
    "start_title": "Commencez Maintenant",
    "start_text": "Votre formation est maintenant accessible dans votre espace étudiant. Connectez-vous pour commencer votre apprentissage :",
    "cta_text": "Accéder à Ma Formation 📖",
    "tips_title": "Conseils pour Réussir",
    "tips_items": [
      "Suivez les vidéos dans l''ordre recommandé",
      "Prenez des notes pendant les cours",
      "Pratiquez régulièrement ce que vous apprenez",
      "N''hésitez pas à revoir les vidéos si nécessaire",
      "Complétez les quiz pour valider vos connaissances"
    ],
    "goal_text": "Terminez la formation à 100% pour obtenir votre certificat de réussite !"
  }'::jsonb,
  '["studentEmail", "studentName", "courseName", "courseDescription"]'::jsonb
);
