import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  studentEmail: string;
  studentName: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentEmail, studentName, userId }: WelcomeEmailRequest = await req.json();

    console.log("Sending welcome email to:", studentEmail);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Générer un lien magique pour connexion automatique
    let magicLink = "https://metaadsmastery.dalaconcept.com/espace-formation";
    
    if (userId) {
      console.log("Generating magic link for user:", userId);
      const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: studentEmail,
        options: {
          redirectTo: "https://metaadsmastery.dalaconcept.com/espace-formation"
        }
      });

      if (magicLinkError) {
        console.error("Error generating magic link:", magicLinkError);
      } else if (magicLinkData?.properties?.action_link) {
        magicLink = magicLinkData.properties.action_link;
        console.log("Magic link generated successfully");
      }
    }

    const logo = "https://jdczbaswcxwemksfkiuf.supabase.co/storage/v1/object/public/certificate-logos/meta-ads-mastery-logo.png";
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #f3f4f6; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
            .logo { text-align: center; padding: 20px; background: white; }
            .logo img { max-width: 200px; height: auto; }
            .header { background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .header p { margin: 10px 0 0; font-size: 16px; }
            .content { background: #ffffff; padding: 30px; }
            .content h3 { color: #22C55E; margin-top: 0; }
            .content p { margin: 12px 0; }
            .benefits { background: #f9fafb; border-left: 4px solid #22C55E; padding: 15px; margin: 20px 0; }
            .benefits ul { margin: 10px 0; padding-left: 20px; }
            .benefits li { margin: 8px 0; }
            .cta-button { display: inline-block; background: #22C55E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .cta-button:hover { background: #16A34A; }
            .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
            a { color: white; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="${logo}" alt="Meta Ads Mastery" />
            </div>
            <div class="header">
              <h1>🎉 Bienvenue dans votre espace étudiant !</h1>
              <p>Votre compte a été créé avec succès</p>
            </div>
            <div class="content">
              <h3>Bonjour ${studentName},</h3>
              <p>Nous sommes ravis de vous accueillir ! Votre espace d'apprentissage personnel Meta Ads Mastery vient d'être créé.</p>
              
              <div class="benefits">
                <h4 style="margin-top: 0; color: #22C55E;">✨ Ce que vous pouvez faire dès maintenant :</h4>
                <ul>
                  <li><strong>Accéder à votre espace personnel</strong> via le lien ci-dessous</li>
                  <li><strong>Personnaliser votre profil</strong> avec vos informations</li>
                  <li><strong>Modifier votre mot de passe</strong> pour sécuriser votre compte</li>
                  <li><strong>Explorer l'interface</strong> et vous familiariser avec la plateforme</li>
                </ul>
              </div>

              <div class="info-box">
                <p style="margin: 0;"><strong>📚 Important :</strong> Votre formation sera bientôt disponible dans votre espace. Vous recevrez un email de notification dès qu'un cours vous sera assigné.</p>
              </div>

              <div style="text-align: center;">
                <a href="${magicLink}" class="cta-button">Accéder à mon espace étudiant</a>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">En attendant l'activation de votre formation, nous vous encourageons à configurer votre profil et à vous familiariser avec la plateforme.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Meta Ads Mastery - Tous droits réservés</p>
              <p>Formation professionnelle en publicité Meta pour entrepreneurs africains</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Meta Ads Mastery <onboarding@metaadsmastery.dalaconcept.com>",
      to: [studentEmail],
      subject: "🎉 Bienvenue sur Meta Ads Mastery - Votre espace étudiant est prêt !",
      html: htmlContent,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

Deno.serve(handler);
