import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { workflowId, contactId, triggerData } = await req.json();

    console.log('Executing workflow:', { workflowId, contactId, hasSubmissionData: !!triggerData });

    // Récupérer le workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('status', 'active')
      .single();

    if (workflowError || !workflow) {
      console.error('Workflow not found or inactive:', workflowError);
      return new Response(
        JSON.stringify({ error: 'Workflow introuvable ou inactif' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer le contact si un contactId est fourni
    let contact: any = null;
    
    if (contactId) {
      const { data: existingContact, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .maybeSingle();

      if (contactError) {
        console.error('Error fetching contact:', contactError);
      }
      
      contact = existingContact;
    }

    // Créer l'exécution du workflow
    const { data: execution, error: executionError } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: workflowId,
        contact_id: contactId || null,
        trigger_data: triggerData || {},
        status: 'pending',
      })
      .select()
      .single();

    if (executionError) {
      console.error('Error creating execution:', executionError);
      throw executionError;
    }

    console.log('Workflow execution created:', execution.id);

    // Si pas de contact et qu'on a des données de formulaire, créer le contact automatiquement
    let currentContact = contact;
    if (!currentContact && triggerData && (triggerData.submission_data || triggerData.data)) {
      console.log('No contact provided, creating from form submission data...');
      try {
        const contactId = await executeCreateContactAction({ type: 'create_contact' }, triggerData, supabase);
        
        // Récupérer le contact créé
        const { data: newContact } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', contactId)
          .single();
        
        currentContact = newContact;
        console.log('Contact auto-created:', contactId);
        
        // Mettre à jour l'exécution avec le contact_id
        await supabase
          .from('workflow_executions')
          .update({ contact_id: contactId })
          .eq('id', execution.id);
      } catch (error: any) {
        console.error('Failed to auto-create contact:', error);
        // Continuer quand même - certaines actions ne nécessitent peut-être pas de contact
      }
    }

    // Exécuter les actions
    const actions = workflow.actions as any[];
    const completedActions: any[] = [];

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      
      try {
        console.log(`Executing action ${i + 1}/${actions.length}:`, action.type);

        // Attendre si un délai est configuré
        if (action.delay_minutes && action.delay_minutes > 0) {
          console.log(`Waiting ${action.delay_minutes} minutes...`);
          // Note: Pour les vrais délais, il faudrait utiliser un système de queue
          // Pour l'instant on ne fait rien
        }

        // Exécuter l'action selon son type
        switch (action.type) {
          case 'create_contact': {
            const createdContactId = await executeCreateContactAction(action, triggerData, supabase);
            
            // Récupérer le contact créé pour les actions suivantes
            const { data: newContact } = await supabase
              .from('contacts')
              .select('*')
              .eq('id', createdContactId)
              .single();
            
            currentContact = newContact;
            console.log('Contact created and set as current contact:', createdContactId);
            break;
          }

          case 'send_email':
            if (!currentContact) throw new Error('Aucun contact disponible pour envoyer email');
            await executeSendEmailAction(action, currentContact, supabase, resend);
            break;

          case 'add_to_list':
            if (!currentContact) throw new Error('Aucun contact disponible pour ajouter à liste');
            await executeAddToListAction(action, currentContact, supabase);
            break;

          case 'remove_from_list':
            if (!currentContact) throw new Error('Aucun contact disponible pour retirer de liste');
            await executeRemoveFromListAction(action, currentContact, supabase);
            break;

          case 'add_tag':
            if (!currentContact) throw new Error('Aucun contact disponible pour ajouter tag');
            await executeAddTagAction(action, currentContact, supabase);
            break;

          case 'remove_tag':
            if (!currentContact) throw new Error('Aucun contact disponible pour retirer tag');
            await executeRemoveTagAction(action, currentContact, supabase);
            break;

          case 'send_notification':
            if (!currentContact) throw new Error('Aucun contact disponible pour notification');
            await executeSendNotificationAction(action, currentContact, supabase, resend);
            break;

          case 'wait':
            // Action d'attente - ne rien faire
            console.log(`Waiting ${action.config.minutes} minutes...`);
            break;

          default:
            console.log(`Unknown action type: ${action.type}`);
        }

        completedActions.push({ action: action.type, status: 'completed', timestamp: new Date().toISOString() });
        console.log(`Action ${i + 1} completed successfully`);

      } catch (actionError: any) {
        console.error(`Error executing action ${i + 1}:`, actionError);
        completedActions.push({ action: action.type, status: 'failed', error: actionError.message, timestamp: new Date().toISOString() });
        
        // Mettre à jour l'exécution comme échouée
        await supabase
          .from('workflow_executions')
          .update({
            status: 'failed',
            error_message: `Action ${i + 1} failed: ${actionError.message}`,
            completed_at: new Date().toISOString(),
            actions_completed: completedActions,
          })
          .eq('id', execution.id);

        return new Response(
          JSON.stringify({ error: `Action ${i + 1} failed`, details: actionError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Mettre à jour l'exécution comme complétée
    await supabase
      .from('workflow_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        actions_completed: completedActions,
      })
      .eq('id', execution.id);

    console.log('Workflow execution completed successfully');

    return new Response(
      JSON.stringify({ success: true, execution_id: execution.id, actions_completed: completedActions.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in execute-workflow function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Action handlers
async function executeCreateContactAction(action: any, triggerData: any, supabase: any): Promise<string> {
  console.log('Creating contact from form submission data:', triggerData);

  // Extraire les données brutes du formulaire depuis triggerData
  const rawFormData = triggerData.submission_data || triggerData.data || triggerData || {};

  // Normaliser les clés grâce au mapping_config du formulaire si disponible
  let formData: any = rawFormData;
  if (triggerData.mapping_config && typeof triggerData.mapping_config === 'object') {
    const mapped: any = {};
    for (const [fieldId, targetKey] of Object.entries(triggerData.mapping_config)) {
      const value = (rawFormData as any)[fieldId as string];
      if (value !== undefined && value !== null && value !== '') {
        mapped[targetKey as string] = value;
      }
    }
    formData = { ...rawFormData, ...mapped };
  }
  
  // Mapper les champs communs
  const contactData: any = {
    source: 'workflow_automation',
    status: 'active',
    metadata: {
      workflow_created: true,
      form_submission_id: triggerData.submission_id,
      submission_date: new Date().toISOString(),
      raw_form_data: rawFormData,
    },
  };

  // Mapper les champs standards (support de différentes variations de noms)
  let emailFromFields: string | null =
    formData.email ||
    formData.email_address ||
    formData.mail ||
    null;

  // Si aucun email explicite via mapping, essayer de le détecter dans les valeurs brutes du formulaire
  if (!emailFromFields) {
    for (const value of Object.values(rawFormData)) {
      if (typeof value === 'string' && /\S+@\S+\.\S+/.test(value)) {
        emailFromFields = value;
        break;
      }
    }
  }

  if (emailFromFields) {
    contactData.email = emailFromFields;
  }

  if (formData.first_name || formData.prenom || formData.firstName) {
    contactData.first_name = formData.first_name || formData.prenom || formData.firstName;
  }
  if (formData.last_name || formData.nom || formData.lastName) {
    contactData.last_name = formData.last_name || formData.nom || formData.lastName;
  }
  if (formData.phone || formData.telephone) contactData.phone = formData.phone || formData.telephone;
  if (formData.notes || formData.message) contactData.notes = formData.notes || formData.message;

  // Email est obligatoire pour créer un contact
  if (!contactData.email) {
    throw new Error('Email manquant dans les données du formulaire. Vérifiez que le formulaire contient un champ email.');
  }

  console.log('Contact data to create/update:', contactData);

  // Vérifier si le contact existe déjà
  const { data: existingContact } = await supabase
    .from('contacts')
    .select('id, email')
    .eq('email', contactData.email)
    .maybeSingle();

  if (existingContact) {
    console.log('Contact already exists, updating:', existingContact.id);
    
    // Mettre à jour le contact existant
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        ...contactData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingContact.id);

    if (updateError) {
      console.error('Error updating contact:', updateError);
      throw updateError;
    }
    
    console.log('Contact updated successfully');
    return existingContact.id;
  } else {
    console.log('Creating new contact');
    
    // Créer un nouveau contact
    const { data: newContact, error: insertError } = await supabase
      .from('contacts')
      .insert(contactData)
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating contact:', insertError);
      throw insertError;
    }
    
    console.log('Contact created successfully:', newContact.id);
    return newContact.id;
  }
}

async function executeSendEmailAction(action: any, contact: any, supabase: any, resend: any) {
  const templateId = action.config.template_id;
  
  if (!templateId) {
    throw new Error('Template ID manquant');
  }

  // Récupérer le template
  const { data: template, error: templateError } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError || !template) {
    throw new Error('Template introuvable');
  }

  // Remplacer les variables dans le contenu
  let htmlBody = template.html_body || '';
  htmlBody = htmlBody.replace(/{contact_name}/g, `${contact.first_name || ''} ${contact.last_name || ''}`);
  htmlBody = htmlBody.replace(/{email}/g, contact.email);

  // Envoyer l'email
  await resend.emails.send({
    from: 'noreply@metaadsmastery.dalaconcept.com',
    to: contact.email,
    subject: template.subject,
    html: htmlBody,
  });

  console.log('Email sent to:', contact.email);
}

async function executeAddToListAction(action: any, contact: any, supabase: any) {
  const listId = action.config.list_id;
  
  if (!listId) {
    throw new Error('List ID manquant');
  }

  // Vérifier si le contact n'est pas déjà dans la liste
  const { data: existing } = await supabase
    .from('contact_list_members')
    .select('id')
    .eq('contact_id', contact.id)
    .eq('list_id', listId)
    .maybeSingle();

  if (!existing) {
    await supabase
      .from('contact_list_members')
      .insert({
        contact_id: contact.id,
        list_id: listId,
      });
    
    console.log('Contact added to list:', listId);
  } else {
    console.log('Contact already in list:', listId);
  }
}

async function executeRemoveFromListAction(action: any, contact: any, supabase: any) {
  const listId = action.config.list_id;
  
  if (!listId) {
    throw new Error('List ID manquant');
  }

  await supabase
    .from('contact_list_members')
    .delete()
    .eq('contact_id', contact.id)
    .eq('list_id', listId);
  
  console.log('Contact removed from list:', listId);
}

async function executeAddTagAction(action: any, contact: any, supabase: any) {
  const tag = action.config.tag;
  
  if (!tag) {
    throw new Error('Tag manquant');
  }

  const currentTags = contact.tags || [];
  
  if (!currentTags.includes(tag)) {
    const updatedTags = [...currentTags, tag];
    
    await supabase
      .from('contacts')
      .update({ tags: updatedTags })
      .eq('id', contact.id);
    
    console.log('Tag added:', tag);
  } else {
    console.log('Tag already exists:', tag);
  }
}

async function executeRemoveTagAction(action: any, contact: any, supabase: any) {
  const tag = action.config.tag;
  
  if (!tag) {
    throw new Error('Tag manquant');
  }

  const currentTags = contact.tags || [];
  const updatedTags = currentTags.filter((t: string) => t !== tag);
  
  await supabase
    .from('contacts')
    .update({ tags: updatedTags })
    .eq('id', contact.id);
  
  console.log('Tag removed:', tag);
}

async function executeSendNotificationAction(action: any, contact: any, supabase: any, resend: any) {
  const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'dadykakwata@gmail.com';
  
  await resend.emails.send({
    from: 'noreply@metaadsmastery.dalaconcept.com',
    to: adminEmail,
    subject: `Notification workflow: ${action.config.message || 'Événement workflow'}`,
    html: `
      <h2>Notification Workflow</h2>
      <p><strong>Contact:</strong> ${contact.first_name} ${contact.last_name} (${contact.email})</p>
      <p><strong>Message:</strong> ${action.config.message || 'Aucun message'}</p>
    `,
  });
  
  console.log('Notification sent to admin');
}
