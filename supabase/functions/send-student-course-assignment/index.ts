import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CourseAssignmentRequest {
  studentEmail: string;
  studentName: string;
  courseName: string;
  courseDescription?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentEmail, studentName, courseName, courseDescription }: CourseAssignmentRequest = await req.json();

    console.log("Sending course assignment email to:", studentEmail);

    const emailResponse = await resend.emails.send({
      from: "Meta Ads Mastery <onboarding@metaadsmastery.dalaconcept.com>",
      to: [studentEmail],
      subject: `🎓 Vous avez accès à la formation : ${courseName}`,
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
              .course-box { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22C55E; }
              .cta-button { display: inline-block; background: #22C55E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .cta-button:hover { background: #16A34A; }
              .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Nouvelle Formation Débloquée !</h1>
                <p>Vous avez maintenant accès à une nouvelle formation</p>
              </div>
              
              <div class="content">
                <p>Bonjour <strong>${studentName}</strong>,</p>
                
                <p>Excellente nouvelle ! Vous avez été inscrit(e) à la formation suivante :</p>
                
                <div class="course-box">
                  <h2 style="margin-top: 0; color: #22C55E;">📚 ${courseName}</h2>
                  ${courseDescription ? `<p>${courseDescription}</p>` : ''}
                </div>
                
                <h3>🚀 Commencez Maintenant</h3>
                <p>Votre formation est maintenant accessible dans votre espace étudiant. Connectez-vous pour commencer votre apprentissage :</p>
                
                <div style="text-align: center;">
                  <a href="https://metaadsmastery.dalaconcept.com/espace-formation" class="cta-button">
                    Accéder à Ma Formation 📖
                  </a>
                </div>
                
                <h3>💡 Conseils pour Réussir</h3>
                <ul>
                  <li>Suivez les vidéos dans l'ordre recommandé</li>
                  <li>Prenez des notes pendant les cours</li>
                  <li>Pratiquez régulièrement ce que vous apprenez</li>
                  <li>N'hésitez pas à revoir les vidéos si nécessaire</li>
                  <li>Complétez les quiz pour valider vos connaissances</li>
                </ul>
                
                <p><strong>🏆 Objectif :</strong> Terminez la formation à 100% pour obtenir votre certificat de réussite !</p>
                
                <p>Bon apprentissage et beaucoup de succès dans votre formation !</p>
                
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

    console.log("Course assignment email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending course assignment email:", error);
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
