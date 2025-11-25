import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    console.log('Processing workflows...');

    // Récupérer tous les workflows actifs
    const { data: workflows, error: workflowsError } = await supabase
      .from('workflows')
      .select('*')
      .eq('status', 'active');

    if (workflowsError) {
      console.error('Error fetching workflows:', workflowsError);
      throw workflowsError;
    }

    console.log(`Found ${workflows?.length || 0} active workflows`);

    const results = [];

    for (const workflow of workflows || []) {
      try {
        console.log(`Processing workflow: ${workflow.name} (${workflow.id})`);

        // Traiter selon le type de déclencheur
        switch (workflow.trigger_type) {
          case 'inactivity':
            await processInactivityWorkflow(workflow, supabase);
            break;

          case 'form_submission':
            // Géré en temps réel lors de la soumission
            console.log('Form submission workflows are handled in real-time');
            break;

          case 'contact_created':
            // Géré en temps réel lors de la création
            console.log('Contact created workflows are handled in real-time');
            break;

          default:
            console.log(`Trigger type ${workflow.trigger_type} not implemented for cron processing`);
        }

        results.push({ workflow_id: workflow.id, status: 'processed' });
      } catch (workflowError: any) {
        console.error(`Error processing workflow ${workflow.id}:`, workflowError);
        results.push({ workflow_id: workflow.id, status: 'failed', error: workflowError.message });
      }
    }

    console.log('Workflow processing completed');

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in process-workflows function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Traiter les workflows d'inactivité
async function processInactivityWorkflow(workflow: any, supabase: any) {
  const inactivityDays = workflow.trigger_config?.days || 7;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - inactivityDays);

  console.log(`Checking for contacts inactive since ${cutoffDate.toISOString()}`);

  // Trouver les contacts inactifs
  const { data: inactiveContacts, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('status', 'active')
    .lt('updated_at', cutoffDate.toISOString());

  if (error) {
    console.error('Error fetching inactive contacts:', error);
    throw error;
  }

  console.log(`Found ${inactiveContacts?.length || 0} inactive contacts`);

  // Déclencher le workflow pour chaque contact inactif
  for (const contact of inactiveContacts || []) {
    // Vérifier qu'on n'a pas déjà exécuté ce workflow pour ce contact récemment
    const { data: recentExecution } = await supabase
      .from('workflow_executions')
      .select('id')
      .eq('workflow_id', workflow.id)
      .eq('contact_id', contact.id)
      .gte('started_at', cutoffDate.toISOString())
      .maybeSingle();

    if (!recentExecution) {
      console.log(`Triggering workflow for inactive contact: ${contact.email}`);
      
      // Appeler l'edge function d'exécution
      await supabase.functions.invoke('execute-workflow', {
        body: {
          workflowId: workflow.id,
          contactId: contact.id,
          triggerData: { type: 'inactivity', days: inactivityDays },
        },
      });
    } else {
      console.log(`Workflow already executed recently for contact: ${contact.email}`);
    }
  }
}
