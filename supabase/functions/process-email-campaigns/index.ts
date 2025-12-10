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

interface CampaignTriggerRequest {
  campaignId: string;
  studentIds?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { campaignId, studentIds }: CampaignTriggerRequest = await req.json();

    console.log("Processing campaign:", campaignId);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.status !== 'active') {
      throw new Error("Campaign is not active");
    }

    // Determine target students
    let targetStudents: any[] = [];
    
    if (studentIds && studentIds.length > 0) {
      // Manual trigger with specific students
      const { data } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', studentIds);
      
      targetStudents = data || [];
    } else {
      // Auto trigger - get students based on campaign rules
      let query = supabase
        .from('profiles')
        .select('user_id, first_name, last_name');

      // If targeting specific course
      if (campaign.target_audience?.course_id) {
        const { data: enrollments } = await supabase
          .from('student_enrollments')
          .select('student_id')
          .eq('course_id', campaign.target_audience.course_id);

        const enrolledStudentIds = enrollments?.map(e => e.student_id) || [];
        query = query.in('user_id', enrolledStudentIds);
      }

      const { data } = await query;
      targetStudents = data || [];
    }

    console.log(`Sending to ${targetStudents.length} students`);

    // Get course name if targeting specific course
    let courseName = '';
    if (campaign.target_audience?.course_id) {
      const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', campaign.target_audience.course_id)
        .single();
      
      courseName = course?.title || '';
    }

    // Helper function to delay between sends
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Send emails sequentially to respect rate limits (2 requests/second max)
    const results: any[] = [];
    
    for (let i = 0; i < targetStudents.length; i++) {
      const student = targetStudents[i];
      
      try {
        // Get student email
        const { data: authUser } = await supabase.auth.admin.getUserById(student.user_id);
        
        if (!authUser?.user?.email) {
          throw new Error("Student email not found");
        }

        const studentEmail = authUser.user.email;
        const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Étudiant';

        // Replace variables in email content
        let emailContent = campaign.html_body
          .replace(/\{student_name\}/g, studentName)
          .replace(/\{course_name\}/g, courseName)
          .replace(/\{espace_formation_link\}/g, 'https://metaadsmastery.dalaconcept.com/espace-formation');

        // Create plain text version (strips HTML tags)
        const textContent = emailContent
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n\n')
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();

        // Simple, personal-looking HTML (avoids Promotions tab)
        const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Bonjour ${studentName},</p>
  ${emailContent}
  <p style="margin-top: 30px;">À bientôt,<br>L'équipe Meta Ads Mastery</p>
  <p style="font-size: 12px; color: #666; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
    Cet email vous est envoyé car vous êtes inscrit à Meta Ads Mastery.<br>
    <a href="https://metaadsmastery.dalaconcept.com" style="color: #666;">metaadsmastery.dalaconcept.com</a>
  </p>
</body>
</html>`;

        // First create the log entry to get the ID for tracking
        const { data: logEntry, error: logError } = await supabase.from('email_campaign_logs').insert({
          campaign_id: campaignId,
          student_id: student.user_id,
          status: 'pending',
        }).select('id').single();

        if (logError) {
          console.error('Error creating log entry:', logError);
          throw logError;
        }

        const logId = logEntry.id;
        console.log(`[${i + 1}/${targetStudents.length}] Sending email to ${studentEmail} with log ID: ${logId}`);

        // Send email with improved deliverability settings
        const emailResponse = await resend.emails.send({
          from: "Meta Ads Mastery <noreply@metaadsmastery.dalaconcept.com>",
          reply_to: "contact@metaadsmastery.dalaconcept.com",
          to: [studentEmail],
          subject: campaign.subject,
          html: fullHtml,
          text: textContent,
          headers: {
            "List-Unsubscribe": "<mailto:unsubscribe@metaadsmastery.dalaconcept.com>",
          },
          tags: [
            { name: "campaign_log_id", value: logId },
            { name: "campaign_id", value: campaignId },
            { name: "student_id", value: student.user_id },
          ],
        });

        console.log(`Resend response for ${studentEmail}:`, JSON.stringify(emailResponse));

        if (emailResponse.error) {
          throw new Error(emailResponse.error.message);
        }

        // Update log with success
        await supabase.from('email_campaign_logs')
          .update({
            status: 'sent',
            metadata: { resend_id: emailResponse.data?.id },
          })
          .eq('id', logId);

        console.log(`Email sent successfully to ${studentEmail}`);
        results.push({ success: true, studentId: student.user_id });

        // Wait 600ms before next email to respect rate limit (2/sec = 500ms min, adding buffer)
        if (i < targetStudents.length - 1) {
          await delay(600);
        }
      } catch (error: any) {
        console.error(`Error sending to student ${student.user_id}:`, error);

        // Log failure
        await supabase.from('email_campaign_logs').insert({
          campaign_id: campaignId,
          student_id: student.user_id,
          status: 'failed',
          error_message: error.message,
        });

        results.push({ success: false, studentId: student.user_id, error: error.message });

        // Still wait before next attempt
        if (i < targetStudents.length - 1) {
          await delay(600);
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `E-mails envoyés: ${successCount} réussis, ${failureCount} échoués`,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in process-email-campaigns:", error);
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
