-- Add preview_text column to email_templates
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS preview_text TEXT;

-- Add html_body column to store the complete HTML body
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS html_body TEXT;

-- Update existing templates with default preview text and convert content to html_body
UPDATE public.email_templates 
SET preview_text = 'Votre message important de Meta Ads Mastery'
WHERE preview_text IS NULL;

-- For confirmation_email template
UPDATE public.email_templates
SET html_body = '<div class="header">
  <h1>🎉 Bienvenue chez Meta Ads Mastery !</h1>
  <p>Votre inscription a été confirmée avec succès</p>
</div>
<div class="content">
  <p>Bonjour,</p>
  <p>Merci de votre intérêt pour notre formation Meta Ads Mastery !</p>
  <h3>Ce qui vous attend :</h3>
  <ul>
    <li>Formation complète de A à Z sur les publicités Meta</li>
    <li>Accès 24/7 à tous les modules vidéo</li>
    <li>Support et accompagnement personnalisé</li>
    <li>Certificat de réussite à la fin de la formation</li>
  </ul>
  <p>Rejoignez notre groupe WhatsApp pour finaliser votre paiement et accéder immédiatement à la formation.</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{whatsapp_link}" style="background: #22C55E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Rejoindre le groupe WhatsApp</a>
  </p>
</div>'
WHERE template_key = 'confirmation_email';

-- For admin_notification_submission template
UPDATE public.email_templates
SET html_body = '<div class="header">
  <h1>📝 Nouvelle inscription</h1>
  <p>Un nouveau prospect s''est inscrit</p>
</div>
<div class="content">
  <p>Bonjour Admin,</p>
  <p>Vous avez reçu une nouvelle inscription à Meta Ads Mastery :</p>
  <ul>
    <li><strong>Nom :</strong> {first_name} {last_name}</li>
    <li><strong>Email :</strong> {email}</li>
    <li><strong>Téléphone :</strong> {phone_number}</li>
    <li><strong>Date :</strong> {created_at}</li>
  </ul>
  <p>Connectez-vous à l''espace admin pour gérer cette inscription.</p>
</div>'
WHERE template_key = 'admin_notification_submission';

-- For admin_notification_message template
UPDATE public.email_templates
SET html_body = '<div class="header">
  <h1>💬 Nouveau message</h1>
  <p>Un visiteur vous a contacté</p>
</div>
<div class="content">
  <p>Bonjour Admin,</p>
  <p>Vous avez reçu un nouveau message de contact :</p>
  <ul>
    <li><strong>Nom :</strong> {name}</li>
    <li><strong>Email :</strong> {email}</li>
  </ul>
  <p><strong>Message :</strong></p>
  <blockquote style="border-left: 4px solid #22C55E; padding-left: 16px; margin: 16px 0;">{message}</blockquote>
  <p>Connectez-vous à l''espace admin pour répondre à ce message.</p>
</div>'
WHERE template_key = 'admin_notification_message';

-- For course_assignment template
UPDATE public.email_templates
SET html_body = '<div class="header">
  <h1>🎓 Vous avez été inscrit à un cours !</h1>
  <p>Accédez maintenant à votre formation</p>
</div>
<div class="content">
  <p>Bonjour {student_name},</p>
  <p>Félicitations ! Vous avez été inscrit au cours : <strong>{course_title}</strong></p>
  <p>Vous pouvez dès maintenant accéder à votre espace de formation et commencer votre apprentissage.</p>
  <h3>Conseils pour réussir :</h3>
  <ul>
    <li>Regardez les vidéos dans l''ordre pour une progression optimale</li>
    <li>Prenez des notes et pratiquez après chaque module</li>
    <li>Complétez les quiz pour valider vos connaissances</li>
    <li>N''hésitez pas à revoir les vidéos si nécessaire</li>
  </ul>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{login_url}" style="background: #22C55E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accéder à ma formation</a>
  </p>
</div>'
WHERE template_key = 'course_assignment';