import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { formId, data } = await req.json();

    console.log('Processing form submission:', { formId, data });

    if (!formId || !data) {
      console.error('Missing formId or data');
      return new Response(
        JSON.stringify({ error: 'formId et data sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer la configuration du formulaire
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single();

    if (formError || !form) {
      console.error('Form not found:', formError);
      return new Response(
        JSON.stringify({ error: 'Formulaire introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Form configuration:', { actionType: form.action_type, mappingConfig: form.mapping_config });

    const results: any = {};

    // 1. Créer la soumission si nécessaire
    if (form.action_type === 'submission' || form.action_type === 'both') {
      const { data: submission, error: submissionError } = await supabase
        .from('form_submissions')
        .insert({
          form_id: formId,
          data: data,
          email: data.email || null,
        })
        .select()
        .single();

      if (submissionError) {
        console.error('Error creating submission:', submissionError);
        throw submissionError;
      }

      console.log('Submission created:', submission.id);
      results.submission = submission;
    }

    // 2. Créer le contact si nécessaire
    if (form.action_type === 'contact' || form.action_type === 'both') {
      const mappingConfig = form.mapping_config || {};
      
      // Construire l'objet contact à partir du mapping
      const contactData: any = {
        source: `form_${formId}`,
        status: 'active',
        metadata: {
          form_id: formId,
          form_title: form.title,
          submission_date: new Date().toISOString(),
          raw_data: data,
        },
      };

      // Mapper les champs du formulaire vers les colonnes de contacts
      Object.entries(mappingConfig).forEach(([fieldId, contactField]) => {
        if (contactField && contactField !== 'none' && data[fieldId]) {
          contactData[contactField as string] = data[fieldId];
        }
      });

      // Email est obligatoire pour créer un contact
      if (!contactData.email) {
        console.error('Email is required to create contact');
        return new Response(
          JSON.stringify({ error: 'Email est requis pour créer un contact' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Creating contact with data:', contactData);

      // Vérifier si le contact existe déjà
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id, email')
        .eq('email', contactData.email)
        .maybeSingle();

      if (existingContact) {
        // Mettre à jour le contact existant
        const { data: updatedContact, error: updateError } = await supabase
          .from('contacts')
          .update({
            ...contactData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingContact.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating contact:', updateError);
          throw updateError;
        }

        console.log('Contact updated:', updatedContact.id);
        results.contact = updatedContact;
      } else {
        // Créer un nouveau contact
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert(contactData)
          .select()
          .single();

        if (contactError) {
          console.error('Error creating contact:', contactError);
          throw contactError;
        }

        console.log('Contact created:', newContact.id);
        results.contact = newContact;
      }
    }

    console.log('Form submission completed successfully:', results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in submit-form function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
