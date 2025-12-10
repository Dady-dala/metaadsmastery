import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    tags?: { name: string; value: string }[];
    click?: {
      link: string;
      timestamp: string;
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const event: ResendWebhookEvent = await req.json();

    console.log("Received Resend webhook event:", event.type);
    console.log("Event data:", JSON.stringify(event.data));

    // Extract campaign log ID from tags if present
    const campaignLogIdTag = event.data.tags?.find(t => t.name === "campaign_log_id");
    const campaignLogId = campaignLogIdTag?.value;

    if (!campaignLogId) {
      console.log("No campaign_log_id tag found, skipping...");
      return new Response(JSON.stringify({ success: true, message: "No tracking ID" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    switch (event.type) {
      case "email.opened": {
        console.log(`Email opened for log: ${campaignLogId}`);
        
        // Get current log data and increment open count
        const { data: currentLog } = await supabase
          .from("email_campaign_logs")
          .select("open_count, opened_at")
          .eq("id", campaignLogId)
          .single();
        
        const updateData: Record<string, unknown> = {
          open_count: (currentLog?.open_count || 0) + 1,
        };
        
        // Set opened_at only if not already set
        if (!currentLog?.opened_at) {
          updateData.opened_at = event.created_at;
        }

        await supabase
          .from("email_campaign_logs")
          .update(updateData)
          .eq("id", campaignLogId);
        break;
      }

      case "email.clicked": {
        console.log(`Email clicked for log: ${campaignLogId}`);
        const clickLink = event.data.click?.link || "";
        
        // Get current log data
        const { data: clickLog } = await supabase
          .from("email_campaign_logs")
          .select("click_count, metadata")
          .eq("id", campaignLogId)
          .single();
        
        const updatedMetadata = {
          ...(clickLog?.metadata || {}),
          last_clicked_link: clickLink,
          click_timestamp: event.created_at,
        };

        await supabase
          .from("email_campaign_logs")
          .update({
            clicked_at: event.created_at,
            click_count: (clickLog?.click_count || 0) + 1,
            metadata: updatedMetadata,
          })
          .eq("id", campaignLogId);
        break;
      }

      case "email.delivered":
        console.log(`Email delivered for log: ${campaignLogId}`);
        await supabase
          .from("email_campaign_logs")
          .update({ status: "delivered" })
          .eq("id", campaignLogId);
        break;

      case "email.bounced":
        console.log(`Email bounced for log: ${campaignLogId}`);
        await supabase
          .from("email_campaign_logs")
          .update({ 
            status: "bounced",
            error_message: "Email bounced - invalid address or mailbox full"
          })
          .eq("id", campaignLogId);
        break;

      case "email.complained":
        console.log(`Email complaint for log: ${campaignLogId}`);
        await supabase
          .from("email_campaign_logs")
          .update({ 
            status: "complained",
            error_message: "Recipient marked email as spam"
          })
          .eq("id", campaignLogId);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error processing Resend webhook:", error);
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
