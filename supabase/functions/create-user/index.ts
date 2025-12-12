import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Verify user is admin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin only' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { email, password, firstName, lastName, role } = await req.json();

    if (!email || !password || !firstName || !lastName || !role) {
      return new Response(
        JSON.stringify({ error: 'Email, password, firstName, lastName, and role are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!['admin', 'student'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be admin or student' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Try to create user with admin API
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    let userId: string;

    if (createError) {
      // Check if user already exists
      if (createError.message.includes('already been registered')) {
        // Get existing user by email
        const { data: existingUsers, error: listError } = await supabaseClient.auth.admin.listUsers();
        
        if (listError) {
          return new Response(
            JSON.stringify({ error: 'Failed to check existing users' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        const existingUser = existingUsers.users.find(u => u.email === email);
        if (!existingUser) {
          return new Response(
            JSON.stringify({ error: 'User exists but could not be found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        userId = existingUser.id;
        console.log('User already exists, assigning role to:', userId);
      } else {
        return new Response(
          JSON.stringify({ error: createError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    } else {
      userId = newUser.user.id;
    }

    // Create or update profile for the user
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
      }, { onConflict: 'user_id' });

    if (profileError) {
      console.error('Error creating/updating profile:', profileError);
    }

    // Check if role already exists
    const { data: existingRole } = await supabaseClient
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', role)
      .maybeSingle();

    if (existingRole) {
      return new Response(
        JSON.stringify({ message: 'User already has this role', user: { id: userId, email } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Assign role to the user
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role,
      });

    if (roleError) {
      console.error('Error assigning role:', roleError);
      return new Response(
        JSON.stringify({ error: 'User exists but role assignment failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ user: { id: userId, email }, message: newUser ? 'User created' : 'Role assigned to existing user' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
