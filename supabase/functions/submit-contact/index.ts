import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactSubmission {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  recaptchaToken?: string;
}

// Simple in-memory rate limiting (resets on function restart)
const submissionCache = new Map<string, { count: number; resetTime: number }>();
const MAX_SUBMISSIONS_PER_HOUR = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 heure en millisecondes

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

function validatePhoneNumber(phone: string): boolean {
  // Accepte les numéros avec ou sans indicatifs, espaces, tirets, etc.
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phone.length <= 20 && phoneRegex.test(phone);
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
    const body: ContactSubmission = await req.json();
    const { first_name, last_name, email, phone_number, recaptchaToken } = body;

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

    // Validation des données
    if (!validateName(first_name)) {
      return new Response(
        JSON.stringify({ 
          error: 'Le prénom est invalide (1-100 caractères requis)' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!validateName(last_name)) {
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

    if (phone_number && !validatePhoneNumber(phone_number)) {
      return new Response(
        JSON.stringify({ 
          error: 'Le numéro de téléphone est invalide' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting basé sur l'email
    if (!checkRateLimit(email)) {
      console.log(`Rate limit exceeded for email: ${email}`);
      return new Response(
        JSON.stringify({ 
          error: 'Trop de soumissions. Veuillez réessayer plus tard.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer un client Supabase avec la clé service_role pour contourner RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Insérer les données dans la base de données
    const { data, error } = await supabaseAdmin
      .from('contact_submissions')
      .insert([
        {
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          email: email.trim().toLowerCase(),
          phone_number: phone_number?.trim() || ''
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

    console.log('Contact submission successful:', { 
      id: data.id, 
      email: email,
      timestamp: new Date().toISOString()
    });

    // Create notification for admins about new contact submission
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .eq('is_active', true);

    console.log('Admin users found for contact submission:', adminUsers?.length || 0);

    if (adminUsers && adminUsers.length > 0) {
      const notifications = adminUsers.map(admin => ({
        user_id: admin.user_id,
        title: 'Nouveau prospect inscrit',
        message: `${first_name} ${last_name} - ${email}`,
        type: 'form',
        link: '/admin?tab=prospects',
      }));

      const { error: notifError } = await supabaseAdmin.from('notifications').insert(notifications);
      
      if (notifError) {
        console.error('Error inserting contact notifications:', notifError);
      } else {
        console.log('Contact notifications created successfully');
      }
    }

    // Send confirmation email to prospect (background task - don't await)
    fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-confirmation-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({
          firstName: first_name,
          lastName: last_name,
          email: email,
        }),
      }
    ).catch(error => console.error('Error sending confirmation email:', error));

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
          type: 'contact_submission',
          data: {
            firstName: first_name,
            lastName: last_name,
            email: email,
            phoneNumber: phone_number,
          },
        }),
      }
    ).catch(error => console.error('Error sending admin notification:', error));

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Votre demande a été enregistrée avec succès'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in submit-contact function:', error);
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
