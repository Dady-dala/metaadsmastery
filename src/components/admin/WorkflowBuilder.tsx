import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, ArrowRight, GripVertical, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface WorkflowBuilderProps {
  workflow: any | null;
  onSave: () => void;
  onCancel: () => void;
}

interface WorkflowAction {
  id: string;
  type: string;
  config: any;
  delay_minutes?: number;
}

export function WorkflowBuilder({ workflow, onSave, onCancel }: WorkflowBuilderProps) {
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [triggerType, setTriggerType] = useState(workflow?.trigger_type || 'form_submission');
  const [triggerConfig, setTriggerConfig] = useState(workflow?.trigger_config || {});
  const [actions, setActions] = useState<WorkflowAction[]>(workflow?.actions || []);
  const [saving, setSaving] = useState(false);
  
  // Resources
  const [forms, setForms] = useState<any[]>([]);
  const [contactLists, setContactLists] = useState<any[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  
  // Action config dialog
  const [editingAction, setEditingAction] = useState<WorkflowAction | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    const [formsData, listsData, templatesData] = await Promise.all([
      supabase.from('forms').select('id, title').eq('is_active', true),
      supabase.from('contact_lists').select('id, name'),
      supabase.from('email_templates').select('id, template_key, subject').eq('is_active', true),
    ]);

    setForms(formsData.data || []);
    setContactLists(listsData.data || []);
    setEmailTemplates(templatesData.data || []);
  };

  const handleAddAction = () => {
    const newAction: WorkflowAction = {
      id: crypto.randomUUID(),
      type: 'send_email',
      config: {},
    };
    setEditingAction(newAction);
    setActionDialogOpen(true);
  };

  const handleEditAction = (action: WorkflowAction) => {
    setEditingAction(action);
    setActionDialogOpen(true);
  };

  const handleSaveAction = () => {
    if (!editingAction) return;

    const existing = actions.find(a => a.id === editingAction.id);
    if (existing) {
      setActions(actions.map(a => a.id === editingAction.id ? editingAction : a));
    } else {
      setActions([...actions, editingAction]);
    }
    
    setActionDialogOpen(false);
    setEditingAction(null);
  };

  const handleRemoveAction = (id: string) => {
    setActions(actions.filter(a => a.id !== id));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(actions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setActions(items);
  };

  const handleSave = async () => {
    if (!name || actions.length === 0) {
      toast.error('Nom et au moins une action sont requis');
      return;
    }

    try {
      setSaving(true);

      const workflowData = {
        name,
        description,
        trigger_type: triggerType,
        trigger_config: triggerConfig as any,
        actions: actions as any,
        status: 'draft',
      };

      if (workflow) {
        const { error } = await supabase
          .from('workflows')
          .update(workflowData)
          .eq('id', workflow.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('workflows')
          .insert([workflowData]);

        if (error) throw error;
      }

      toast.success(workflow ? 'Workflow mis à jour' : 'Workflow créé');
      onSave();
    } catch (error: any) {
      console.error('Error saving workflow:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      create_contact: '👤 Créer un contact',
      send_email: '📧 Envoyer email',
      add_to_list: '📋 Ajouter à liste',
      remove_from_list: '🗑️ Retirer de liste',
      add_tag: '🏷️ Ajouter tag',
      remove_tag: '❌ Retirer tag',
      update_field: '✏️ Modifier champ',
      wait: '⏱️ Attendre',
      send_notification: '🔔 Envoyer notification',
    };
    return labels[type] || type;
  };

  const getTriggerLabel = (type: string) => {
    const labels: Record<string, string> = {
      form_submission: '📝 Soumission formulaire',
      contact_created: '👤 Nouveau contact',
      email_opened: '📧 Email ouvert',
      link_clicked: '🔗 Lien cliqué',
      inactivity: '⏰ Inactivité',
      tag_added: '🏷️ Tag ajouté',
      list_added: '📋 Ajout à liste',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Informations de base */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du Workflow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nom du workflow</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Bienvenue nouveau contact"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez ce que fait ce workflow"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Déclencheur */}
      <Card>
        <CardHeader>
          <CardTitle>Déclencheur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Type de déclencheur</Label>
            <Select value={triggerType} onValueChange={setTriggerType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="form_submission">📝 Soumission de formulaire</SelectItem>
                <SelectItem value="contact_created">👤 Nouveau contact créé</SelectItem>
                <SelectItem value="email_opened">📧 Email ouvert</SelectItem>
                <SelectItem value="link_clicked">🔗 Lien cliqué</SelectItem>
                <SelectItem value="inactivity">⏰ Inactivité</SelectItem>
                <SelectItem value="tag_added">🏷️ Tag ajouté</SelectItem>
                <SelectItem value="list_added">📋 Ajout à une liste</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Config spécifique au déclencheur */}
          {triggerType === 'form_submission' && (
            <div>
              <Label>Formulaire</Label>
              <Select
                value={triggerConfig.form_id || ''}
                onValueChange={(value) => setTriggerConfig({ ...triggerConfig, form_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un formulaire" />
                </SelectTrigger>
                <SelectContent>
                  {forms.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {triggerType === 'inactivity' && (
            <div>
              <Label>Nombre de jours d'inactivité</Label>
              <Input
                type="number"
                value={triggerConfig.days || 7}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, days: parseInt(e.target.value) })}
                min="1"
              />
            </div>
          )}

          {triggerType === 'tag_added' && (
            <div>
              <Label>Tag déclencheur</Label>
              <Input
                value={triggerConfig.tag || ''}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, tag: e.target.value })}
                placeholder="Nom du tag"
              />
            </div>
          )}

          {triggerType === 'list_added' && (
            <div>
              <Label>Liste déclencheuse</Label>
              <Select
                value={triggerConfig.list_id || ''}
                onValueChange={(value) => setTriggerConfig({ ...triggerConfig, list_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une liste" />
                </SelectTrigger>
                <SelectContent>
                  {contactLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Actions</CardTitle>
            <Button onClick={handleAddAction} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une action
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucune action configurée. Ajoutez une action pour commencer.
            </p>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="workflow-actions">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {actions.map((action, index) => (
                      <Draggable key={action.id} draggableId={action.id} index={index}>
                        {(provided, snapshot) => (
                          <div>
                            {index > 0 && (
                              <div className="flex items-center justify-center py-2">
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                {action.delay_minutes && (
                                  <Badge variant="outline" className="ml-2">
                                    Attendre {action.delay_minutes} min
                                  </Badge>
                                )}
                              </div>
                            )}
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-2 p-3 rounded-lg bg-muted/50 border transition-all ${
                                snapshot.isDragging ? 'shadow-lg scale-105 border-primary' : ''
                              }`}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{getActionLabel(action.type)}</div>
                                <div className="text-sm text-muted-foreground">
                                  {action.type === 'create_contact' && (
                                    <>Crée un contact à partir des données du formulaire</>
                                  )}
                                  {action.type === 'send_email' && action.config.template_id && (
                                    <>Email: {emailTemplates.find(t => t.id === action.config.template_id)?.subject}</>
                                  )}
                                  {action.type === 'add_to_list' && action.config.list_id && (
                                    <>Liste: {contactLists.find(l => l.id === action.config.list_id)?.name}</>
                                  )}
                                  {action.type === 'add_tag' && action.config.tag && (
                                    <>Tag: {action.config.tag}</>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAction(action)}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAction(action.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurer l'action</DialogTitle>
          </DialogHeader>
          {editingAction && (
            <div className="space-y-4">
              <div>
                <Label>Type d'action</Label>
                <Select
                  value={editingAction.type}
                  onValueChange={(value) => setEditingAction({ ...editingAction, type: value, config: {} })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create_contact">👤 Créer un contact</SelectItem>
                    <SelectItem value="send_email">📧 Envoyer email</SelectItem>
                    <SelectItem value="add_to_list">📋 Ajouter à liste</SelectItem>
                    <SelectItem value="remove_from_list">🗑️ Retirer de liste</SelectItem>
                    <SelectItem value="add_tag">🏷️ Ajouter tag</SelectItem>
                    <SelectItem value="remove_tag">❌ Retirer tag</SelectItem>
                    <SelectItem value="wait">⏱️ Attendre</SelectItem>
                    <SelectItem value="send_notification">🔔 Envoyer notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingAction.type === 'create_contact' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Cette action créera un nouveau contact à partir des données du formulaire soumis.
                  </p>
                  <div>
                    <Label>Mapping des champs (optionnel)</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Par défaut, les champs "email", "first_name", "last_name" et "phone" seront automatiquement mappés s'ils existent dans le formulaire.
                    </p>
                  </div>
                </div>
              )}

              {editingAction.type === 'send_email' && (
                <div>
                  <Label>Template d'email</Label>
                  <Select
                    value={editingAction.config.template_id || ''}
                    onValueChange={(value) => setEditingAction({
                      ...editingAction,
                      config: { ...editingAction.config, template_id: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un template" />
                    </SelectTrigger>
                    <SelectContent>
                      {emailTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(editingAction.type === 'add_to_list' || editingAction.type === 'remove_from_list') && (
                <div>
                  <Label>Liste de contacts</Label>
                  <Select
                    value={editingAction.config.list_id || ''}
                    onValueChange={(value) => setEditingAction({
                      ...editingAction,
                      config: { ...editingAction.config, list_id: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une liste" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactLists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(editingAction.type === 'add_tag' || editingAction.type === 'remove_tag') && (
                <div>
                  <Label>Tag</Label>
                  <Input
                    value={editingAction.config.tag || ''}
                    onChange={(e) => setEditingAction({
                      ...editingAction,
                      config: { ...editingAction.config, tag: e.target.value }
                    })}
                    placeholder="Nom du tag"
                  />
                </div>
              )}

              {editingAction.type === 'wait' && (
                <div>
                  <Label>Durée d'attente (minutes)</Label>
                  <Input
                    type="number"
                    value={editingAction.config.minutes || 0}
                    onChange={(e) => setEditingAction({
                      ...editingAction,
                      config: { ...editingAction.config, minutes: parseInt(e.target.value) }
                    })}
                    min="1"
                  />
                </div>
              )}

              <div>
                <Label>Délai avant cette action (minutes)</Label>
                <Input
                  type="number"
                  value={editingAction.delay_minutes || 0}
                  onChange={(e) => setEditingAction({
                    ...editingAction,
                    delay_minutes: parseInt(e.target.value) || undefined
                  })}
                  min="0"
                  placeholder="0 = immédiat"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSaveAction}>
                  Enregistrer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Boutons de sauvegarde */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Sauvegarde..." : workflow ? "Mettre à jour" : "Créer le workflow"}
        </Button>
      </div>
    </div>
  );
}
