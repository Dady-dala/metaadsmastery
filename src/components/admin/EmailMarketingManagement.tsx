import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Mail, Play, Pause, Trash2, BarChart3 } from "lucide-react";
import { EmailCampaignEditor } from "./EmailCampaignEditor";
import { EmailCampaignStats } from "./EmailCampaignStats";
import { EmailMarketingDashboard } from "./EmailMarketingDashboard";

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  html_body: string;
  status: string;
  trigger_type: string;
  trigger_config: any;
  target_audience: any;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export function EmailMarketingManagement() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      console.error('Error loading campaigns:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les campagnes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (campaignId: string, newStatus: 'active' | 'paused') => {
    try {
      const { error } = await supabase
        .from('email_campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Campagne ${newStatus === 'active' ? 'activée' : 'mise en pause'}`,
      });

      loadCampaigns();
    } catch (error: any) {
      console.error('Error updating campaign status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) return;

    try {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Campagne supprimée",
      });

      loadCampaigns();
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la campagne",
        variant: "destructive",
      });
    }
  };

  const getTriggerLabel = (triggerType: string) => {
    const labels: Record<string, string> = {
      manual: '📧 Manuel',
      new_student: '👋 Nouvel étudiant',
      course_assigned: '📚 Assignation formation',
      course_completed: '🎓 Formation complétée',
      inactivity: '⏰ Inactivité',
      date_based: '📅 Date spécifique',
      percentage_progress: '📊 Progression %',
      form_submitted: '📝 Formulaire soumis',
    };
    return labels[triggerType] || triggerType;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      active: 'default',
      paused: 'outline',
      completed: 'secondary',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status === 'draft' && 'Brouillon'}
        {status === 'active' && 'Active'}
        {status === 'paused' && 'En pause'}
        {status === 'completed' && 'Terminée'}
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Marketing par E-mail</h2>
          <p className="text-muted-foreground">
            Créez des campagnes automatisées pour vos étudiants
          </p>
        </div>
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedCampaign(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle campagne
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedCampaign ? 'Modifier la campagne' : 'Nouvelle campagne'}
              </DialogTitle>
            </DialogHeader>
            <EmailCampaignEditor
              campaign={selectedCampaign}
              onSave={() => {
                setIsEditorOpen(false);
                loadCampaigns();
              }}
              onCancel={() => setIsEditorOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <EmailMarketingDashboard />

      <div className="grid gap-4">
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Aucune campagne créée. Créez votre première campagne d'e-mailing.
              </p>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {campaign.name}
                      {getStatusBadge(campaign.status)}
                    </CardTitle>
                    <CardDescription>
                      Déclencheur: {getTriggerLabel(campaign.trigger_type)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setIsStatsOpen(true);
                      }}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    {campaign.status === 'active' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(campaign.id, 'paused')}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : campaign.status === 'paused' || campaign.status === 'draft' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(campaign.id, 'active')}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setIsEditorOpen(true);
                      }}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(campaign.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p className="font-medium">Objet: {campaign.subject}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Statistiques de la campagne</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <EmailCampaignStats campaignId={selectedCampaign.id} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
