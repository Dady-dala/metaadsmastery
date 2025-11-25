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

    console.log("=== Starting email send ===");
    console.log("To:", toEmail);
    console.log("Subject:", subject);
    console.log("Has HTML body:", !!htmlBody);

    // Send email via Resend with reply-to configured
    console.log("Calling Resend API...");
    const emailResponse = await resend.emails.send({
      from: "Meta Ads Mastery <metamastery@aldiacoruu.resend.app>",
      to: [toEmail],
      reply_to: "metamastery@aldiacoruu.resend.app",
      subject: subject,
      html: htmlBody,
      headers: {
        'X-Entity-Ref-ID': crypto.randomUUID(),
      },
    });

    console.log("Resend API response:", JSON.stringify(emailResponse));

    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      throw new Error(`Resend error: ${JSON.stringify(emailResponse.error)}`);
    }

    console.log("Email sent successfully, ID:", emailResponse.data?.id);

    // Get current user
    const authHeader = req.headers.get('Authorization');
    let createdBy = null;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        createdBy = user?.id || null;
        console.log("Email sent by user:", createdBy);
      } catch (authError) {
        console.log("Could not get user from auth token:", authError);
      }
    }

    // Store email in database
    console.log("Storing email in database...");
    const { data: insertedEmail, error: dbError } = await supabase
      .from('emails')
      .insert([{
        from_email: 'metamastery@aldiacoruu.resend.app',
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
      }])
      .select()
      .single();

    if (dbError) {
      console.error("Error storing email in database:", dbError);
      throw dbError;
    }

    console.log("Email stored in database with ID:", insertedEmail?.id);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id, dbId: insertedEmail?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("=== Error in send-transactional-email function ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error:", JSON.stringify(error, null, 2));
    return new Response(
      JSON.stringify({ error: error.message, details: error.toString() }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
