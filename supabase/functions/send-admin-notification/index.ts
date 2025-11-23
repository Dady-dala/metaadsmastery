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

    const content = template.content as any;
    const logo = "https://jdczbaswcxwemksfkiuf.supabase.co/storage/v1/object/public/certificate-logos/meta-ads-mastery-logo.png";

    let htmlContent = `
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
            .content { background: #ffffff; padding: 30px; }
            .field { margin: 15px 0; padding: 10px; background: #f9fafb; border-left: 3px solid #22C55E; }
            .label { font-weight: bold; color: #374151; }
            .value { color: #1f2937; margin-top: 5px; }
            .message-box { background: #f0fdf4; padding: 15px; border-radius: 8px; margin-top: 15px; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="${logo}" alt="Meta Ads Mastery" />
            </div>
            <div class="header">
              <h2>${content.title}</h2>
            </div>
            
            <div class="content">
              <p>${content.intro}</p>
    `;

    if (type === "contact_submission") {
      htmlContent += `
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
      `;
    } else {
      htmlContent += `
              <div class="field">
                <div class="label">Nom :</div>
                <div class="value">${data.name}</div>
              </div>
              
              <div class="field">
                <div class="label">Email :</div>
                <div class="value">${data.email}</div>
              </div>
              
              <div class="message-box">
                <div class="label">Message :</div>
                <div class="value">${data.message}</div>
              </div>
      `;
    }

    htmlContent += `
              <div class="field">
                <div class="label">Date :</div>
                <div class="value">${new Date().toLocaleString("fr-FR")}</div>
              </div>
              
              <p style="margin-top: 20px;"><strong>Action requise :</strong> ${content.action_required}</p>
            </div>
            
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
