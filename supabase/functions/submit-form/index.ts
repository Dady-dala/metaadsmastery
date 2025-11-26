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

    console.log('Form configuration:', { formId: form.id, title: form.title });

    // Créer la soumission
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

    console.log('Submission created successfully:', submission.id);

    // Déclencher les workflows associés à ce formulaire
    const { data: workflows, error: workflowsError } = await supabase
      .from('workflows')
      .select('id, name, trigger_config')
      .eq('status', 'active')
      .eq('trigger_type', 'form_submission');

    if (!workflowsError && workflows) {
      const matchingWorkflows = workflows.filter(
        wf => wf.trigger_config?.form_id === formId
      );

      console.log(`Found ${matchingWorkflows.length} workflows to trigger for form ${formId}`);

      for (const workflow of matchingWorkflows) {
        console.log(`Triggering workflow: ${workflow.name} (${workflow.id})`);
        
        try {
          // Appeler execute-workflow avec les données de soumission
          const { error: invokeError } = await supabase.functions.invoke('execute-workflow', {
            body: {
              workflowId: workflow.id,
              contactId: null, // Pas de contact existant - sera créé par le workflow
              triggerData: {
                type: 'form_submission',
                form_id: formId,
                submission_id: submission.id,
                submission_data: data,
                data: data, // Alias pour faciliter l'accès
              },
            },
          });

          if (invokeError) {
            console.error(`Error invoking workflow ${workflow.id}:`, invokeError);
          } else {
            console.log(`Workflow ${workflow.id} triggered successfully`);
          }
        } catch (workflowError: any) {
          console.error(`Failed to trigger workflow ${workflow.id}:`, workflowError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        submission,
        workflows_triggered: workflows?.filter(wf => wf.trigger_config?.form_id === formId).length || 0,
        message: 'Formulaire soumis avec succès. Les workflows automatisés ont été déclenchés.'
      }),
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
