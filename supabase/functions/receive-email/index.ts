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
    const emailData = await req.json();
    
    console.log('Received email webhook:', emailData);

    // Extract email information from Resend webhook payload
    const { from, to, subject, html, text, reply_to } = emailData;

    // Store the received email in the database
    const { data, error } = await supabase.from('emails').insert({
      from_email: from,
      to_email: to,
      subject: subject || '(Pas de sujet)',
      html_body: html || text || '',
      text_body: text,
      reply_to_id: null,
      status: 'received',
      metadata: {
        sent_by_admin: false,
        received_at: new Date().toISOString(),
        raw_data: emailData
      }
    }).select().single();

    if (error) {
      console.error('Error storing received email:', error);
      throw error;
    }

    console.log('Email stored successfully:', data);

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
