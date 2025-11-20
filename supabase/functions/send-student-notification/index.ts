import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  email: string;
  studentName: string;
  notificationType: 'course_assigned' | 'certificate_earned' | 'quiz_passed' | 'quiz_failed' | 'inactivity_reminder';
  data?: {
    courseName?: string;
    score?: number;
    passingScore?: number;
    daysInactive?: number;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, studentName, notificationType, data }: NotificationRequest = await req.json();

    let subject = "";
    let html = "";

    switch (notificationType) {
      case 'course_assigned':
        subject = `🎓 Nouveau cours disponible: ${data?.courseName}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #7C3AED;">Félicitations ${studentName}!</h1>
            <p>Un nouveau cours vous a été assigné:</p>
            <h2 style="color: #10B981;">${data?.courseName}</h2>
            <p>Connectez-vous à votre espace de formation pour commencer votre apprentissage!</p>
            <a href="${Deno.env.get("VITE_SUPABASE_URL")}/espace-formation" 
               style="display: inline-block; background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
              Accéder à mes cours
            </a>
          </div>
        `;
        break;

      case 'certificate_earned':
        subject = `🏆 Certificat obtenu: ${data?.courseName}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #7C3AED;">Félicitations ${studentName}!</h1>
            <p>Vous avez terminé avec succès le cours:</p>
            <h2 style="color: #10B981;">${data?.courseName}</h2>
            <p>Votre certificat de réussite est maintenant disponible dans votre profil!</p>
            <a href="${Deno.env.get("VITE_SUPABASE_URL")}/espace-formation" 
               style="display: inline-block; background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
              Télécharger mon certificat
            </a>
          </div>
        `;
        break;

      case 'quiz_passed':
        subject = `✅ Quiz réussi: ${data?.courseName}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10B981;">Excellent travail ${studentName}!</h1>
            <p>Vous avez réussi le quiz du cours <strong>${data?.courseName}</strong></p>
            <p style="font-size: 24px; color: #7C3AED;">Score: ${data?.score}%</p>
            <p>Continuez votre progression!</p>
          </div>
        `;
        break;

      case 'quiz_failed':
        subject = `📚 Révision recommandée: ${data?.courseName}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #EF4444;">Ne vous découragez pas ${studentName}!</h1>
            <p>Votre tentative au quiz du cours <strong>${data?.courseName}</strong> n'a pas atteint le seuil requis.</p>
            <p>Score obtenu: ${data?.score}% | Score requis: ${data?.passingScore}%</p>
            <p>Révisez le contenu et tentez à nouveau. Vous pouvez y arriver!</p>
            <a href="${Deno.env.get("VITE_SUPABASE_URL")}/espace-formation" 
               style="display: inline-block; background-color: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
              Revoir le cours
            </a>
          </div>
        `;
        break;

      case 'inactivity_reminder':
        subject = "⏰ Vos cours vous attendent!";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #7C3AED;">Bonjour ${studentName}!</h1>
            <p>Nous avons remarqué que vous n'avez pas visité votre espace de formation depuis ${data?.daysInactive} jours.</p>
            <p>N'oubliez pas que la régularité est la clé du succès!</p>
            <p>Vos cours vous attendent. Reprenez votre apprentissage dès maintenant!</p>
            <a href="${Deno.env.get("VITE_SUPABASE_URL")}/espace-formation" 
               style="display: inline-block; background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
              Continuer ma formation
            </a>
          </div>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: "Meta Ads Mastery <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: html,
    });

    console.log("Notification email sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
