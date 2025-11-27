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

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Starting cascading deletion for user:', userId);

    // Delete related records in order (to respect foreign key constraints)
    
    // 1. Delete video notes
    const { error: notesError } = await supabaseClient
      .from('video_notes')
      .delete()
      .eq('student_id', userId);
    if (notesError) console.error('Error deleting video notes:', notesError);

    // 2. Delete video progress
    const { error: progressError } = await supabaseClient
      .from('video_progress')
      .delete()
      .eq('student_id', userId);
    if (progressError) console.error('Error deleting video progress:', progressError);

    // 3. Delete quiz attempts
    const { error: quizError } = await supabaseClient
      .from('quiz_attempts')
      .delete()
      .eq('student_id', userId);
    if (quizError) console.error('Error deleting quiz attempts:', quizError);

    // 4. Delete student badges
    const { error: badgesError } = await supabaseClient
      .from('student_badges')
      .delete()
      .eq('student_id', userId);
    if (badgesError) console.error('Error deleting student badges:', badgesError);

    // 5. Delete certificates
    const { error: certsError } = await supabaseClient
      .from('certificates')
      .delete()
      .eq('student_id', userId);
    if (certsError) console.error('Error deleting certificates:', certsError);

    // 6. Delete student enrollments
    const { error: enrollError } = await supabaseClient
      .from('student_enrollments')
      .delete()
      .eq('student_id', userId);
    if (enrollError) console.error('Error deleting enrollments:', enrollError);

    // 7. Delete email campaign logs
    const { error: campaignLogsError } = await supabaseClient
      .from('email_campaign_logs')
      .delete()
      .eq('student_id', userId);
    if (campaignLogsError) console.error('Error deleting campaign logs:', campaignLogsError);

    // 8. Delete password reset tokens
    const { error: tokensError } = await supabaseClient
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', userId);
    if (tokensError) console.error('Error deleting password reset tokens:', tokensError);

    // 9. Delete notifications
    const { error: notifsError } = await supabaseClient
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    if (notifsError) console.error('Error deleting notifications:', notifsError);

    // 10. Update created_by references to null (don't delete these records)
    await supabaseClient.from('workflows').update({ created_by: null }).eq('created_by', userId);
    await supabaseClient.from('forms').update({ created_by: null }).eq('created_by', userId);
    await supabaseClient.from('emails').update({ created_by: null }).eq('created_by', userId);
    await supabaseClient.from('email_campaigns').update({ created_by: null }).eq('created_by', userId);
    await supabaseClient.from('contacts').update({ created_by: null }).eq('created_by', userId);
    await supabaseClient.from('contact_lists').update({ created_by: null }).eq('created_by', userId);

    // 11. Delete user roles
    const { error: rolesError } = await supabaseClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    if (rolesError) console.error('Error deleting user roles:', rolesError);

    // 12. Delete profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('user_id', userId);
    if (profileError) console.error('Error deleting profile:', profileError);

    console.log('Cascading deletion completed, now deleting auth user');

    // 10. Finally, delete the auth user
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('User deleted successfully:', userId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in delete-user:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
