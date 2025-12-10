import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const event = await req.json();
    console.log("Received Resend webhook event:", event.type);
    console.log("Event data:", JSON.stringify(event.data));

    // Tags can be an object or array - handle both cases
    const tags = event.data.tags;
    let campaignLogId: string | undefined;
    
    if (tags) {
      if (typeof tags === 'object' && !Array.isArray(tags)) {
        // Tags is an object like { campaign_log_id: "...", campaign_id: "..." }
        campaignLogId = tags.campaign_log_id;
      } else if (Array.isArray(tags)) {
        // Tags is an array like [{ name: "campaign_log_id", value: "..." }]
        const logIdTag = tags.find((tag: any) => tag.name === "campaign_log_id");
        campaignLogId = logIdTag?.value;
      }
    }

    if (!campaignLogId) {
      console.log("No campaign_log_id found in tags, skipping update");
      return new Response(JSON.stringify({ success: true, message: "No campaign log to update" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date().toISOString();
    let updateData: Record<string, any> = {};

    switch (event.type) {
      case "email.sent":
        updateData = { status: "sent" };
        break;
      case "email.delivered":
        updateData = { status: "delivered" };
        break;
      case "email.opened":
        // Get current record to increment open_count
        const { data: currentOpen } = await supabase
          .from("email_campaign_logs")
          .select("open_count, opened_at")
          .eq("id", campaignLogId)
          .single();
        
        updateData = {
          opened_at: currentOpen?.opened_at || now,
          open_count: (currentOpen?.open_count || 0) + 1,
        };
        break;
      case "email.clicked":
        // Get current record to increment click_count
        const { data: currentClick } = await supabase
          .from("email_campaign_logs")
          .select("click_count, clicked_at")
          .eq("id", campaignLogId)
          .single();
        
        updateData = {
          clicked_at: currentClick?.clicked_at || now,
          click_count: (currentClick?.click_count || 0) + 1,
        };
        break;
      case "email.bounced":
        updateData = { status: "bounced", error_message: "Email bounced" };
        break;
      case "email.complained":
        updateData = { status: "complained", error_message: "Recipient marked as spam" };
        break;
      default:
        console.log("Unhandled event type:", event.type);
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from("email_campaign_logs")
        .update(updateData)
        .eq("id", campaignLogId);

      if (error) {
        console.error("Error updating campaign log:", error);
        throw error;
      }
      console.log("Successfully updated campaign log:", campaignLogId, updateData);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error processing Resend webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
