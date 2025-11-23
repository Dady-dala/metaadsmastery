import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminNotificationRequest {
  type: "contact_submission" | "contact_message";
  data: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    phoneNumber?: string;
    message?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data }: AdminNotificationRequest = await req.json();
    const adminEmail = Deno.env.get("ADMIN_EMAIL");

    if (!adminEmail) {
      throw new Error("ADMIN_EMAIL not configured");
    }

    console.log("Sending admin notification:", type);

    let subject = "";
    let htmlContent = "";

    if (type === "contact_submission") {
      subject = "🎓 Nouvelle inscription à Meta Ads Mastery";
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
              .field { margin: 15px 0; padding: 10px; background: #f9fafb; border-left: 3px solid #22C55E; }
              .label { font-weight: bold; color: #374151; }
              .value { color: #1f2937; margin-top: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>📝 Nouvelle Inscription</h2>
              </div>
              
              <div class="content">
                <p>Un nouveau prospect s'est inscrit à Meta Ads Mastery :</p>
                
                <div class="field">
                  <div class="label">Nom complet :</div>
                  <div class="value">${data.firstName} ${data.lastName}</div>
                </div>
                
                <div class="field">
                  <div class="label">Email :</div>
                  <div class="value">${data.email}</div>
                </div>
                
                <div class="field">
                  <div class="label">Téléphone :</div>
                  <div class="value">${data.phoneNumber || "Non fourni"}</div>
                </div>
                
                <div class="field">
                  <div class="label">Date d'inscription :</div>
                  <div class="value">${new Date().toLocaleString("fr-FR")}</div>
                </div>
                
                <p style="margin-top: 20px;"><strong>Action requise :</strong> Le prospect a reçu un email de confirmation avec le lien du groupe WhatsApp.</p>
              </div>
            </div>
          </body>
        </html>
      `;
    } else {
      subject = "💬 Nouveau message de contact";
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
              .field { margin: 15px 0; padding: 10px; background: #f9fafb; border-left: 3px solid #22C55E; }
              .label { font-weight: bold; color: #374151; }
              .value { color: #1f2937; margin-top: 5px; }
              .message-box { background: #f0fdf4; padding: 15px; border-radius: 8px; margin-top: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>💬 Nouveau Message</h2>
              </div>
              
              <div class="content">
                <p>Vous avez reçu un nouveau message via le formulaire de contact :</p>
                
                <div class="field">
                  <div class="label">Nom :</div>
                  <div class="value">${data.name}</div>
                </div>
                
                <div class="field">
                  <div class="label">Email :</div>
                  <div class="value">${data.email}</div>
                </div>
                
                <div class="field">
                  <div class="label">Date :</div>
                  <div class="value">${new Date().toLocaleString("fr-FR")}</div>
                </div>
                
                <div class="message-box">
                  <div class="label">Message :</div>
                  <div class="value">${data.message}</div>
                </div>
                
                <p style="margin-top: 20px;"><strong>Action requise :</strong> Répondez à ce message via ${data.email}</p>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Meta Ads Mastery <onboarding@metaadsmastery.dalaconcept.com>",
      to: [adminEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log("Admin notification sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending admin notification:", error);
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
