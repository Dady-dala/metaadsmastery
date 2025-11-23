import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

    // Fetch template from database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("template_key", "course_assignment")
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      throw new Error("Template not found");
    }

    const logo = "https://jdczbaswcxwemksfkiuf.supabase.co/storage/v1/object/public/certificate-logos/meta-ads-mastery-logo.png";
    
    // Replace variables in HTML body
    let htmlBody = template.html_body || '';
    htmlBody = htmlBody.replace(/{student_name}/g, studentName);
    htmlBody = htmlBody.replace(/{course_title}/g, courseName);
    htmlBody = htmlBody.replace(/{course_description}/g, courseDescription || '');
    htmlBody = htmlBody.replace(/{login_url}/g, "https://metaadsmastery.dalaconcept.com/espace-formation");

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
            .content h3 { color: #22C55E; }
            .content ul { margin: 16px 0; padding-left: 20px; }
            .content li { margin: 8px 0; }
            .cta-button { display: inline-block; background: #22C55E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .cta-button:hover { background: #16A34A; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
            a { color: white; text-decoration: none; }
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
              <p>Formation professionnelle en publicité Meta pour entrepreneurs africains</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Meta Ads Mastery <onboarding@metaadsmastery.dalaconcept.com>",
      to: [studentEmail],
      subject: template.subject,
      html: htmlContent,
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
