import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  firstName: string;
  lastName: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firstName, lastName, email }: ConfirmationEmailRequest = await req.json();

    console.log("Sending confirmation email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Meta Ads Mastery <onboarding@metaadsmastery.dalaconcept.com>",
      to: [email],
      subject: "Bienvenue chez Meta Ads Mastery ! 🚀",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
              .cta-button { display: inline-block; background: #22C55E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .cta-button:hover { background: #16A34A; }
              .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Félicitations ${firstName} !</h1>
                <p>Vous êtes à un pas de transformer votre activité avec Meta Ads</p>
              </div>
              
              <div class="content">
                <h2>Bienvenue dans Meta Ads Mastery !</h2>
                
                <p>Bonjour <strong>${firstName} ${lastName}</strong>,</p>
                
                <p>Nous sommes ravis de vous accueillir ! Vous avez pris la meilleure décision pour maîtriser la publicité Meta et développer votre business.</p>
                
                <h3>🎯 Notre Promesse</h3>
                <p>À la fin de cette formation, vous serez capable de :</p>
                <ul>
                  <li>Créer et gérer des campagnes publicitaires Meta performantes</li>
                  <li>Cibler précisément votre audience pour maximiser vos conversions</li>
                  <li>Optimiser vos budgets publicitaires pour un ROI optimal</li>
                  <li>Analyser vos résultats et prendre des décisions data-driven</li>
                </ul>
                
                <h3>📱 Prochaine Étape Importante</h3>
                <p>Pour finaliser votre inscription et accéder immédiatement à la formation, rejoignez notre groupe WhatsApp privé :</p>
                
                <div style="text-align: center;">
                  <a href="https://chat.whatsapp.com/G9oQ3mJuK6U8kuJle3qsdt" class="cta-button">
                    Rejoindre le Groupe WhatsApp 💬
                  </a>
                </div>
                
                <p><strong>Avez-vous rejoint le groupe ?</strong> Si vous rencontrez des difficultés, cliquez sur le bouton ci-dessus ou contactez-nous directement.</p>
                
                <h3>💡 Ce qui vous attend</h3>
                <p>Une formation complète, pratique et accessible 24/7 pour maîtriser Meta Ads de A à Z, avec un accompagnement personnalisé et des bonus exclusifs.</p>
                
                <p>À très bientôt dans la formation !</p>
                
                <p><strong>L'équipe Meta Ads Mastery</strong></p>
              </div>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} Meta Ads Mastery - Tous droits réservés</p>
                <p>Formation professionnelle en publicité Meta pour entrepreneurs africains</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
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
