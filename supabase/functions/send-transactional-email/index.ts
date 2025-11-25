import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TransactionalEmailRequest {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlBody: string;
  replyToId?: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { toEmail, toName, subject, htmlBody, replyToId }: TransactionalEmailRequest = await req.json();

    console.log("Sending transactional email to:", toEmail);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Meta Ads Mastery <onboarding@metaadsmastery.dalaconcept.com>",
      to: [toEmail],
      subject: subject,
      html: htmlBody,
    });

    console.log("Email sent successfully:", emailResponse);

    // Get current user
    const authHeader = req.headers.get('Authorization');
    let createdBy = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      createdBy = user?.id || null;
    }

    // Store email in database
    const { error: dbError } = await supabase
      .from('emails')
      .insert([{
        from_email: 'onboarding@metaadsmastery.dalaconcept.com',
        from_name: 'Meta Ads Mastery',
        to_email: toEmail,
        to_name: toName || null,
        subject: subject,
        html_body: htmlBody,
        reply_to_id: replyToId || null,
        status: 'sent',
        created_by: createdBy,
        metadata: {
          sent_by_admin: true,
          resend_id: emailResponse.data?.id
        }
      }]);

    if (dbError) {
      console.error("Error storing email in database:", dbError);
      throw dbError;
    }

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-transactional-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
