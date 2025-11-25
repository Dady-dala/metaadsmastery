import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the incoming webhook data from Resend
    const payload = await req.json();

    console.log('Received email webhook:', payload);

    // Resend "email.received" payload structure:
    // {
    //   created_at: string,
    //   type: "email.received",
    //   data: {
    //     from: string,
    //     to: string[],
    //     subject?: string,
    //     email_id: string, // Use this to fetch full content
    //     ...
    //   }
    // }

    const data = payload.data ?? {};
    const emailId = data.email_id;

    const from = data.from ?? payload.from;
    const toArray = data.to ?? (payload.to ? [payload.to] : []);
    const to = Array.isArray(toArray) ? toArray.join(', ') : toArray;
    const subject = data.subject ?? payload.subject ?? '(Pas de sujet)';

    // Fetch full email content from Resend API using email_id
    let htmlBody = '';
    let textBody = '';

    if (emailId) {
      try {
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (resendApiKey) {
          const response = await fetch(`https://api.resend.com/emails/${emailId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const emailDetails = await response.json();
            console.log('Fetched email details from Resend:', emailDetails);
            htmlBody = emailDetails.html || emailDetails.body || '';
            textBody = emailDetails.text || emailDetails.body || '';
          } else {
            console.error('Failed to fetch email from Resend:', await response.text());
          }
        }
      } catch (fetchError: any) {
        console.error('Error fetching email content from Resend:', fetchError);
      }
    }

    // Store the received email in the database
    const { data: insertedEmail, error } = await supabase.from('emails').insert({
      from_email: from,
      to_email: to,
      subject,
      html_body: htmlBody,
      text_body: textBody,
      reply_to_id: null,
      status: 'received',
      metadata: {
        sent_by_admin: false,
        received_at: new Date().toISOString(),
        raw_data: payload,
        email_id: emailId,
      },
    }).select().single();

    if (error) {
      console.error('Error storing received email:', error);
      throw error;
    }

    console.log('Email stored successfully:', insertedEmail);

    return new Response(
      JSON.stringify({ success: true, email_id: data.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('Error in receive-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
