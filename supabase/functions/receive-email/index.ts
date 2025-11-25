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
    //     html?: string,
    //     text?: string,
    //     ...
    //   }
    // }

    const data = payload.data ?? {};

    const from = data.from ?? payload.from;
    const toArray = data.to ?? (payload.to ? [payload.to] : []);
    const to = Array.isArray(toArray) ? toArray.join(', ') : toArray;

    const subject = data.subject ?? payload.subject ?? '(Pas de sujet)';
    const html = data.html ?? payload.html ?? null;
    const text = data.text ?? payload.text ?? null;

    // Store the received email in the database
    const { data: insertedEmail, error } = await supabase.from('emails').insert({
      from_email: from,
      to_email: to,
      subject,
      html_body: html || text || '',
      text_body: text,
      reply_to_id: null,
      status: 'received',
      metadata: {
        sent_by_admin: false,
        received_at: new Date().toISOString(),
        raw_data: payload,
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
