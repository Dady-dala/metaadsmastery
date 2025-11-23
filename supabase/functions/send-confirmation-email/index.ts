import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

    // Fetch template from database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("template_key", "confirmation_email")
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      throw new Error("Template not found");
    }

    // Replace variables in HTML body
    let htmlBody = template.html_body || '';
    htmlBody = htmlBody.replace(/{first_name}/g, firstName);
    htmlBody = htmlBody.replace(/{last_name}/g, lastName);
    htmlBody = htmlBody.replace(/{email}/g, email);
    htmlBody = htmlBody.replace(/{whatsapp_link}/g, "https://chat.whatsapp.com/G9oQ3mJuK6U8kuJle3qsdt");

    // Simple, transactional HTML format to avoid promotional tab
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${htmlBody}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            © ${new Date().getFullYear()} Meta Ads Mastery<br>
            Cet email concerne votre inscription à notre formation.
          </p>
        </body>
      </html>
    `;

    // Plain text version for better deliverability
    const textBody = `
Bonjour ${firstName},

Nous avons bien reçu votre inscription à Meta Ads Mastery.

Prochaines étapes :
- Rejoignez notre groupe WhatsApp pour finaliser votre inscription
- Accédez à la formation complète
- Bénéficiez de notre accompagnement personnalisé

Lien WhatsApp : https://chat.whatsapp.com/G9oQ3mJuK6U8kuJle3qsdt

Si vous avez des questions, répondez simplement à cet email.

Cordialement,
L'équipe Meta Ads Mastery

---
© ${new Date().getFullYear()} Meta Ads Mastery
    `.trim();

    const emailResponse = await resend.emails.send({
      from: "Meta Ads Mastery <contact@metaadsmastery.dalaconcept.com>",
      to: [email],
      reply_to: "contact@metaadsmastery.dalaconcept.com",
      subject: template.subject,
      html: htmlContent,
      text: textBody,
      headers: {
        'X-Entity-Ref-ID': `contact-${Date.now()}`,
      },
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
