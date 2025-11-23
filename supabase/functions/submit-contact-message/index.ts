import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactMessage {
  name: string;
  email: string;
  message: string;
  recaptchaToken?: string;
}

// Simple in-memory rate limiting (resets on function restart)
const submissionCache = new Map<string, { count: number; resetTime: number }>();
const MAX_SUBMISSIONS_PER_HOUR = 3;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = submissionCache.get(identifier);

  if (!record || now > record.resetTime) {
    submissionCache.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }

  if (record.count >= MAX_SUBMISSIONS_PER_HOUR) {
    return false;
  }

  record.count++;
  return true;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function validateName(name: string): boolean {
  return name.trim().length > 0 && name.length <= 100;
}

function validateMessage(message: string): boolean {
  return message.trim().length > 0 && message.length <= 250;
}

function sanitizeInput(input: string): string {
  // Remove any HTML tags and trim whitespace
  return input.replace(/<[^>]*>/g, '').trim();
}

async function verifyRecaptcha(token: string): Promise<boolean> {
  const recaptchaSecret = Deno.env.get('RECAPTCHA_SECRET_KEY');
  
  // If no secret is configured, skip verification (log warning)
  if (!recaptchaSecret) {
    console.warn('RECAPTCHA_SECRET_KEY not configured - skipping reCAPTCHA verification');
    return true;
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${recaptchaSecret}&response=${token}`
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: ContactMessage = await req.json();
    const { name, email, message, recaptchaToken } = body;

    // Validate reCAPTCHA token
    if (recaptchaToken) {
      const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
      if (!isValidRecaptcha) {
        console.log('Invalid reCAPTCHA token');
        return new Response(
          JSON.stringify({ 
            error: 'Vérification reCAPTCHA échouée. Veuillez réessayer.' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Server-side validation
    if (!validateName(name)) {
      return new Response(
        JSON.stringify({ 
          error: 'Le nom est invalide (1-100 caractères requis)' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!validateEmail(email)) {
      return new Response(
        JSON.stringify({ 
          error: 'L\'adresse email est invalide' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!validateMessage(message)) {
      return new Response(
        JSON.stringify({ 
          error: 'Le message est invalide (1-250 caractères requis)' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting based on email
    if (!checkRateLimit(email)) {
      console.log(`Rate limit exceeded for email: ${email}`);
      return new Response(
        JSON.stringify({ 
          error: 'Trop de messages envoyés. Veuillez réessayer plus tard.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service_role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Sanitize and insert data
    const { data, error } = await supabaseAdmin
      .from('contact_messages')
      .insert([
        {
          name: sanitizeInput(name),
          email: email.trim().toLowerCase(),
          message: sanitizeInput(message)
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Erreur lors de l\'enregistrement. Veuillez réessayer.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Contact message submission successful:', { 
      id: data.id, 
      email: email,
      timestamp: new Date().toISOString()
    });

    // Send admin notification (background task - don't await)
    fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-admin-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({
          type: 'contact_message',
          data: {
            name: sanitizeInput(name),
            email: email,
            message: sanitizeInput(message),
          },
        }),
      }
    ).catch(error => console.error('Error sending admin notification:', error));

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Votre message a été envoyé avec succès'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in submit-contact-message function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Une erreur est survenue. Veuillez réessayer.' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
