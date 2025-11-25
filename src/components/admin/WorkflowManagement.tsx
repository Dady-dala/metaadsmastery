import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Play, Pause, Trash2, Zap, ArrowRight, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { WorkflowBuilder } from "./WorkflowBuilder";

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: any;
  actions: any[];
  status: 'active' | 'paused' | 'draft';
  created_at: string;
}

export function WorkflowManagement() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedWorkflowStats, setSelectedWorkflowStats] = useState<any>(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows((data as any) || []);
    } catch (error: any) {
      console.error('Error loading workflows:', error);
      toast.error('Erreur lors du chargement des workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (workflowId: string, newStatus: 'active' | 'paused') => {
    try {
      const { error } = await supabase
        .from('workflows')
        .update({ status: newStatus })
        .eq('id', workflowId);

      if (error) throw error;

      toast.success(`Workflow ${newStatus === 'active' ? 'activé' : 'mis en pause'}`);
      loadWorkflows();
    } catch (error: any) {
      console.error('Error updating workflow status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (workflowId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce workflow ?')) return;

    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflowId);

      if (error) throw error;

      toast.success('Workflow supprimé');
      loadWorkflows();
    } catch (error: any) {
      console.error('Error deleting workflow:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleViewStats = async (workflow: Workflow) => {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflow.id)
        .order('started_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const stats = {
        total: data.length,
        completed: data.filter(e => e.status === 'completed').length,
        failed: data.filter(e => e.status === 'failed').length,
        pending: data.filter(e => e.status === 'pending').length,
      };

      setSelectedWorkflowStats(stats);
      setStatsDialogOpen(true);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    }
  };

  const getTriggerLabel = (type: string) => {
    const labels: Record<string, string> = {
      form_submission: '📝 Soumission de formulaire',
      contact_created: '👤 Nouveau contact',
      email_opened: '📧 Email ouvert',
      link_clicked: '🔗 Lien cliqué',
      inactivity: '⏰ Inactivité',
      date_based: '📅 Date spécifique',
      tag_added: '🏷️ Tag ajouté',
    };
    return labels[type] || type;
  };

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      send_email: '📧 Envoyer email',
      add_to_list: '📋 Ajouter à liste',
      remove_from_list: '🗑️ Retirer de liste',
      add_tag: '🏷️ Ajouter tag',
      remove_tag: '❌ Retirer tag',
      update_field: '✏️ Modifier champ',
      wait: '⏱️ Attendre',
      notify_admin: '🔔 Notifier admin',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: 'default',
      paused: 'secondary',
      draft: 'outline',
    };
    const labels: Record<string, string> = {
      active: 'Actif',
      paused: 'En pause',
      draft: 'Brouillon',
    };
    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Automatisations & Workflows</h2>
          <p className="text-muted-foreground">
            Automatisez vos actions marketing et gagnez du temps
          </p>
        </div>
        <Button onClick={() => {
          setSelectedWorkflow(null);
          setBuilderOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Créer un workflow
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {workflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  </div>
                  <CardDescription>{workflow.description}</CardDescription>
                </div>
                {getStatusBadge(workflow.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Déclencheur */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">DÉCLENCHEUR</div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {getTriggerLabel(workflow.trigger_type)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">ACTIONS</div>
                <div className="space-y-2">
                  {workflow.actions.map((action, index) => (
                    <div key={index} className="flex items-start gap-2">
                      {index > 0 && (
                        <div className="flex flex-col items-center">
                          <div className="w-px h-2 bg-border" />
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <div className="w-px h-2 bg-border" />
                        </div>
                      )}
                      <div className="flex-1 p-3 rounded-lg bg-muted/50">
                        <div className="text-sm font-medium">
                          {getActionLabel(action.type)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions du workflow */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleStatusChange(workflow.id, workflow.status === 'active' ? 'paused' : 'active')}
                >
                  {workflow.status === 'active' ? (
                    <>
                      <Pause className="mr-2 h-3 w-3" />
                      Mettre en pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-3 w-3" />
                      Activer
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedWorkflow(workflow);
                    setBuilderOpen(true);
                  }}
                >
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewStats(workflow)}
                >
                  <BarChart3 className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(workflow.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message d'information */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Zap className="h-8 w-8 text-primary shrink-0" />
            <div className="space-y-1">
              <h3 className="font-semibold">Automatisez votre marketing</h3>
              <p className="text-sm text-muted-foreground">
                Les workflows vous permettent de créer des séquences d'actions automatiques déclenchées par des événements spécifiques. 
                Gagnez du temps et améliorez vos conversions en automatisant vos communications.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Builder Dialog */}
      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedWorkflow ? 'Modifier le workflow' : 'Créer un workflow'}
            </DialogTitle>
          </DialogHeader>
          <WorkflowBuilder
            workflow={selectedWorkflow}
            onSave={() => {
              setBuilderOpen(false);
              setSelectedWorkflow(null);
              loadWorkflows();
            }}
            onCancel={() => {
              setBuilderOpen(false);
              setSelectedWorkflow(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Statistiques du workflow</DialogTitle>
          </DialogHeader>
          {selectedWorkflowStats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{selectedWorkflowStats.total}</div>
                    <div className="text-sm text-muted-foreground">Exécutions totales</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">{selectedWorkflowStats.completed}</div>
                    <div className="text-sm text-muted-foreground">Complétées</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600">{selectedWorkflowStats.failed}</div>
                    <div className="text-sm text-muted-foreground">Échouées</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-yellow-600">{selectedWorkflowStats.pending}</div>
                    <div className="text-sm text-muted-foreground">En attente</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
