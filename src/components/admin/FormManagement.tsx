import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormEditor } from "./FormEditor";
import { useToast } from "@/hooks/use-toast";
import { Plus, Eye, Edit, Trash2, Power, PowerOff } from "lucide-react";

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
  const { toast } = useToast();

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
      toast({
        title: "Erreur",
        description: "Impossible de charger les formulaires",
        variant: "destructive",
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

      toast({
        title: "Succès",
        description: !currentStatus ? "Formulaire activé" : "Formulaire désactivé",
      });

      loadForms();
    } catch (error: any) {
      console.error('Error toggling form status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de changer le statut",
        variant: "destructive",
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

      toast({
        title: "Succès",
        description: "Formulaire supprimé",
      });

      loadForms();
    } catch (error: any) {
      console.error('Error deleting form:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le formulaire",
        variant: "destructive",
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
                <div className="flex gap-2">
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
    </div>
  );
}
