import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormEditor } from "./FormEditor";
import { toast } from "sonner";
import { Plus, Eye, Edit, Trash2, Power, PowerOff, Share2, Code } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Form {
  id: string;
  title: string;
  description: string | null;
  fields: any;
  is_active: boolean;
  created_at: string;
}

export function FormManagement() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [shareForm, setShareForm] = useState<Form | null>(null);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error: any) {
      console.error('Error loading forms:', error);
      toast.error("Erreur", {
        description: "Impossible de charger les formulaires",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (formId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('forms')
        .update({ is_active: !currentStatus })
        .eq('id', formId);

      if (error) throw error;

      toast.success("Succès", {
        description: !currentStatus ? "Formulaire activé" : "Formulaire désactivé",
      });

      loadForms();
    } catch (error: any) {
      console.error('Error toggling form status:', error);
      toast.error("Erreur", {
        description: "Impossible de changer le statut",
      });
    }
  };

  const handleDelete = async (formId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce formulaire ?")) return;

    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);

      if (error) throw error;

      toast.success("Succès", {
        description: "Formulaire supprimé",
      });

      loadForms();
    } catch (error: any) {
      console.error('Error deleting form:', error);
      toast.error("Erreur", {
        description: "Impossible de supprimer le formulaire",
      });
    }
  };

  const handleEdit = (form: Form) => {
    setSelectedForm(form);
    setEditorOpen(true);
  };

  const handleNew = () => {
    setSelectedForm(null);
    setEditorOpen(true);
  };

  const handleSave = () => {
    setEditorOpen(false);
    setSelectedForm(null);
    loadForms();
  };

  const handleShare = (form: Form) => {
    setShareForm(form);
    setShareDialogOpen(true);
  };

  const handleEmbed = (form: Form) => {
    setShareForm(form);
    setEmbedDialogOpen(true);
  };

  const getShareLink = (formId: string) => {
    return `${window.location.origin}/formulaire/${formId}`;
  };

  const getEmbedCode = (formId: string) => {
    return `<iframe src="${getShareLink(formId)}" width="100%" height="600" frameborder="0"></iframe>`;
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié", {
      description: message,
    });
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Formulaires</h2>
          <p className="text-muted-foreground">
            Créez des formulaires personnalisés pour capturer des leads ou mener des enquêtes
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau formulaire
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {forms.map((form) => (
          <Card key={form.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{form.title}</CardTitle>
                  {form.description && (
                    <CardDescription>{form.description}</CardDescription>
                  )}
                </div>
                <Badge variant={form.is_active ? "default" : "secondary"}>
                  {form.is_active ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {Array.isArray(form.fields) ? form.fields.length : 0} champs
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(form)}
                  >
                    <Share2 className="mr-2 h-3 w-3" />
                    Partager
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEmbed(form)}
                  >
                    <Code className="mr-2 h-3 w-3" />
                    Intégrer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(form)}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(form.id, form.is_active)}
                  >
                    {form.is_active ? (
                      <>
                        <PowerOff className="mr-2 h-3 w-3" />
                        Désactiver
                      </>
                    ) : (
                      <>
                        <Power className="mr-2 h-3 w-3" />
                        Activer
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(form.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedForm ? "Modifier le formulaire" : "Créer un formulaire"}
            </DialogTitle>
          </DialogHeader>
          <FormEditor
            form={selectedForm}
            onSave={handleSave}
            onCancel={() => {
              setEditorOpen(false);
              setSelectedForm(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Partager le formulaire</DialogTitle>
          </DialogHeader>
          {shareForm && (
            <div className="space-y-4">
              <div>
                <Label>Lien public</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={getShareLink(shareForm.id)}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={() => copyToClipboard(getShareLink(shareForm.id), "Lien copié dans le presse-papier")}
                  >
                    Copier
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Partagez ce lien pour permettre aux utilisateurs de remplir votre formulaire.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={embedDialogOpen} onOpenChange={setEmbedDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Intégrer le formulaire</DialogTitle>
          </DialogHeader>
          {shareForm && (
            <div className="space-y-4">
              <div>
                <Label>Code d'intégration (iframe)</Label>
                <div className="mt-2">
                  <textarea
                    value={getEmbedCode(shareForm.id)}
                    readOnly
                    className="w-full h-24 font-mono text-sm p-3 border rounded-md bg-muted"
                  />
                  <Button
                    className="mt-2"
                    onClick={() => copyToClipboard(getEmbedCode(shareForm.id), "Code d'intégration copié")}
                  >
                    Copier le code
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Copiez ce code et collez-le dans votre site web pour intégrer le formulaire.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
