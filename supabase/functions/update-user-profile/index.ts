import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, firstName, lastName } = await req.json()

    if (!userId || !firstName || !lastName) {
      throw new Error('userId, firstName, and lastName are required')
    }

    console.log(`Updating profile for user ${userId}`)

    // Upsert the user's profile (create if doesn't exist, update if exists)
    const { data, error } = await supabaseClient
      .from('profiles')
      .upsert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      throw error
    }

    console.log(`Profile updated successfully for user ${userId}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        profile: data
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in update-user-profile function:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
