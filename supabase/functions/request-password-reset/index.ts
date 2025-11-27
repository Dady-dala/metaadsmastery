import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "L'email est requis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if user exists
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error fetching users:", userError);
      throw userError;
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate secure token (32 random bytes)
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes, byte => byte.toString(16).padStart(2, '0')).join('');

    // Set expiration to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Store token in database
    const { error: tokenError } = await supabaseAdmin
      .from("password_reset_tokens")
      .insert({
        user_id: user.id,
        token: token,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error("Error storing reset token:", tokenError);
      throw tokenError;
    }

    // Create reset link with Lovable domain
    const resetLink = `https://metaadsmastery.lovable.app/reset-password?token=${token}`;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Meta Ads Mastery <noreply@metaadsmastery.dalaconcept.com>",
      to: [email],
      subject: "Réinitialisez votre mot de passe",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #1a0033 0%, #2d0052 100%);
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 40px 30px;
            }
            .content h2 {
              color: #1a0033;
              margin-top: 0;
              font-size: 24px;
            }
            .content p {
              margin: 16px 0;
              color: #555555;
            }
            .button {
              display: inline-block;
              padding: 14px 32px;
              background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 24px 0;
              text-align: center;
            }
            .button:hover {
              background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            }
            .footer {
              background-color: #f9f9f9;
              padding: 20px 30px;
              text-align: center;
              font-size: 14px;
              color: #777777;
              border-top: 1px solid #e5e5e5;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px 16px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .warning p {
              margin: 0;
              color: #856404;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Réinitialisez votre mot de passe</h1>
            </div>
            
            <div class="content">
              <h2>Bonjour,</h2>
              
              <p>Vous avez récemment demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau :</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Réinitialiser le mot de passe</a>
              </div>
              
              <div class="warning">
                <p><strong>⚠️ Important :</strong> Ce lien est valide pendant 1 heure et ne peut être utilisé qu'une seule fois.</p>
              </div>
              
              <p>Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email en toute sécurité. Votre mot de passe actuel reste inchangé.</p>
            </div>
            
            <div class="footer">
              <p><strong>Meta Ads Mastery</strong></p>
              <p>La formation complète en publicité Facebook/Meta pour entrepreneurs africains</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email de réinitialisation envoyé:", emailResponse);

    return new Response(
      JSON.stringify({ message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé." }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Erreur dans request-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
