import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

    // Fetch template from database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const templateKey = type === "contact_submission" 
      ? "admin_notification_submission" 
      : "admin_notification_message";

    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("template_key", templateKey)
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      throw new Error("Template not found");
    }

    const logo = "https://jdczbaswcxwemksfkiuf.supabase.co/storage/v1/object/public/certificate-logos/meta-ads-mastery-logo.png";
    
    // Replace variables in HTML body
    let htmlBody = template.html_body || '';
    
    if (type === "contact_submission") {
      htmlBody = htmlBody.replace(/{first_name}/g, data.firstName || '');
      htmlBody = htmlBody.replace(/{last_name}/g, data.lastName || '');
      htmlBody = htmlBody.replace(/{email}/g, data.email);
      htmlBody = htmlBody.replace(/{phone_number}/g, data.phoneNumber || "Non fourni");
      htmlBody = htmlBody.replace(/{created_at}/g, new Date().toLocaleString("fr-FR"));
    } else {
      htmlBody = htmlBody.replace(/{name}/g, data.name || '');
      htmlBody = htmlBody.replace(/{email}/g, data.email);
      htmlBody = htmlBody.replace(/{message}/g, data.message || '');
    }

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
            .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 10px 0 0; }
            .content { background: #ffffff; padding: 30px; }
            .content ul { margin: 16px 0; padding-left: 20px; }
            .content li { margin: 8px 0; }
            .content strong { color: #22C55E; }
            .content blockquote { border-left: 4px solid #22C55E; padding-left: 16px; margin: 16px 0; color: #555; font-style: italic; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="${logo}" alt="Meta Ads Mastery" />
            </div>
            ${htmlBody}
            <div class="footer">
              <p>© ${new Date().getFullYear()} Meta Ads Mastery - Tous droits réservés</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Meta Ads Mastery <onboarding@metaadsmastery.dalaconcept.com>",
      to: [adminEmail],
      subject: template.subject,
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
