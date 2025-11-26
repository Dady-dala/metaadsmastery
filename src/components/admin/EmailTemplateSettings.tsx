import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Mail, Save, Eye, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EmailTemplate {
  id: string;
  template_key: string;
  subject: string;
  preview_text: string | null;
  html_body: string | null;
  content: any;
  variables: any;
  is_active: boolean;
}

const systemTemplateKeys = [
  'confirmation_email',
  'admin_notification_submission',
  'admin_notification_message',
  'course_assignment',
];

const templateLabels: Record<string, string> = {
  confirmation_email: "Email de Confirmation Prospect",
  admin_notification_submission: "Notification Admin - Inscription",
  admin_notification_message: "Notification Admin - Message",
  course_assignment: "Email d'Affectation au Cours",
};

export const EmailTemplateSettings = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    template_key: "",
    subject: "",
    preview_text: "",
    html_body: "",
    variables: [] as string[],
  });
  const [newVariable, setNewVariable] = useState("");
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("template_key");

      if (error) throw error;
      setTemplates(data || []);
      if (data && data.length > 0) {
        setSelectedTemplate(data[0]);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Erreur lors du chargement des templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("email_templates")
        .update({
          subject: selectedTemplate.subject,
          preview_text: selectedTemplate.preview_text,
          html_body: selectedTemplate.html_body,
        })
        .eq("id", selectedTemplate.id);

      if (error) throw error;

      toast.success("Template mis à jour avec succès");
      fetchTemplates();
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("Erreur lors de la mise à jour du template");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.template_key || !newTemplate.subject) {
      toast.error("Clé et sujet sont requis");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("email_templates")
        .insert({
          template_key: newTemplate.template_key,
          subject: newTemplate.subject,
          preview_text: newTemplate.preview_text,
          html_body: newTemplate.html_body,
          content: {},
          variables: newTemplate.variables,
          is_active: true,
        });

      if (error) throw error;

      toast.success("Template créé avec succès");
      setCreateDialogOpen(false);
      setNewTemplate({
        template_key: "",
        subject: "",
        preview_text: "",
        html_body: "",
        variables: [],
      });
      setNewVariable("");
      fetchTemplates();
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Erreur lors de la création du template");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", selectedTemplate.id);

      if (error) throw error;

      toast.success("Template supprimé avec succès");
      setDeleteDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Erreur lors de la suppression du template");
    } finally {
      setSaving(false);
    }
  };

  const addVariable = () => {
    if (newVariable && !newTemplate.variables.includes(newVariable)) {
      setNewTemplate({
        ...newTemplate,
        variables: [...newTemplate.variables, newVariable],
      });
      setNewVariable("");
    }
  };

  const removeVariable = (variable: string) => {
    setNewTemplate({
      ...newTemplate,
      variables: newTemplate.variables.filter(v => v !== variable),
    });
  };

  const generatePreview = (template: EmailTemplate) => {
    const logo = "https://jdczbaswcxwemksfkiuf.supabase.co/storage/v1/object/public/certificate-logos/meta-ads-mastery-logo.png";
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #f3f4f6; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .logo { text-align: center; padding: 20px; background: white; }
            .logo img { max-width: 200px; height: auto; }
            .header { background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .header p { margin: 10px 0 0; font-size: 16px; }
            .content { padding: 30px; }
            .content h3 { color: #22C55E; }
            .content ul { margin: 16px 0; padding-left: 20px; }
            .content li { margin: 8px 0; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
            a { color: white; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="${logo}" alt="Meta Ads Mastery" />
            </div>
            ${template.html_body || '<div class="content"><p>Aucun contenu</p></div>'}
            <div class="footer">
              <p>© ${new Date().getFullYear()} Meta Ads Mastery - Tous droits réservés</p>
              <p>Formation professionnelle en publicité Meta pour entrepreneurs africains</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return html;
  };

  const handlePreview = () => {
    if (!selectedTemplate) return;
    const html = generatePreview(selectedTemplate);
    setPreviewHtml(html);
  };

  const insertVariable = (variable: string) => {
    if (!quillRef.current) return;
    const editor = quillRef.current.getEditor();
    const cursorPosition = editor.getSelection()?.index || 0;
    editor.insertText(cursorPosition, `{${variable}}`);
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Gestion des Templates Email</h2>
          <p className="text-muted-foreground">
            Personnalisez les emails envoyés automatiquement aux prospects et étudiants
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Créer un template
        </Button>
      </div>

      {/* Navigation par sélection et flèches */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const currentIndex = templates.findIndex(t => t.template_key === selectedTemplate?.template_key);
              if (currentIndex > 0) {
                // Créer une nouvelle référence pour forcer le re-render
                setSelectedTemplate({ ...templates[currentIndex - 1] });
              }
            }}
            disabled={!selectedTemplate || templates.findIndex(t => t.template_key === selectedTemplate?.template_key) === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const currentIndex = templates.findIndex(t => t.template_key === selectedTemplate?.template_key);
              if (currentIndex < templates.length - 1) {
                // Créer une nouvelle référence pour forcer le re-render
                setSelectedTemplate({ ...templates[currentIndex + 1] });
              }
            }}
            disabled={!selectedTemplate || templates.findIndex(t => t.template_key === selectedTemplate?.template_key) === templates.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Select
          value={selectedTemplate?.template_key}
          onValueChange={(value) => {
            const template = templates.find((t) => t.template_key === value);
            if (template) {
              // Créer une nouvelle référence pour forcer le re-render
              setSelectedTemplate({ ...template });
            }
          }}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Sélectionner un template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.template_key}>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {templateLabels[template.template_key] || template.template_key}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTemplate && (
        <Card key={selectedTemplate.template_key}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{templateLabels[selectedTemplate.template_key] || selectedTemplate.template_key}</CardTitle>
                <CardDescription>
                  Variables disponibles: {selectedTemplate.variables.join(", ")}
                </CardDescription>
              </div>
              {!systemTemplateKeys.includes(selectedTemplate.template_key) && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="subject">Sujet de l'email (Objectif)</Label>
              <Input
                id="subject"
                placeholder="Ex: Bienvenue chez Meta Ads Mastery !"
                value={selectedTemplate?.subject || ""}
                onChange={(e) =>
                  selectedTemplate &&
                  setSelectedTemplate({
                    ...selectedTemplate,
                    subject: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preview_text">Texte d'aperçu</Label>
              <Input
                id="preview_text"
                placeholder="Ex: Votre message important de Meta Ads Mastery"
                value={selectedTemplate?.preview_text || ""}
                onChange={(e) =>
                  selectedTemplate &&
                  setSelectedTemplate({
                    ...selectedTemplate,
                    preview_text: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Ce texte apparaît dans l'aperçu de l'email avant ouverture
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="html_body">Corps du mail</Label>
                <div className="flex gap-1 flex-wrap">
                  {selectedTemplate.variables.map((variable: string) => (
                    <Button
                      key={variable}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(variable)}
                      className="text-xs"
                    >
                      +{variable}
                    </Button>
                  ))}
                </div>
              </div>
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={selectedTemplate?.html_body || ""}
                onChange={(value) =>
                  selectedTemplate &&
                  setSelectedTemplate({
                    ...selectedTemplate,
                    html_body: value,
                  })
                }
                modules={modules}
                className="bg-background"
                style={{ height: "400px", marginBottom: "50px" }}
              />
              <p className="text-xs text-muted-foreground mt-12">
                Utilisez les boutons de formatage pour styliser votre email. Cliquez sur les variables ci-dessus pour les insérer.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={handlePreview}>
                    <Eye className="mr-2 h-4 w-4" />
                    Prévisualiser
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Prévisualisation de l'email</DialogTitle>
                    <DialogDescription>
                      Voici à quoi ressemblera l'email envoyé
                    </DialogDescription>
                  </DialogHeader>
                  <div
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                    className="border rounded-lg p-4"
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de création */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouveau template email</DialogTitle>
            <DialogDescription>
              Créez un template réutilisable pour vos emails automatisés
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new_template_key">Clé du template (unique) *</Label>
              <Input
                id="new_template_key"
                placeholder="Ex: welcome_newsletter, new_contact"
                value={newTemplate.template_key}
                onChange={(e) => setNewTemplate({ ...newTemplate, template_key: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Identifiant unique sans espaces (utilisé dans les workflows)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_subject">Sujet de l'email *</Label>
              <Input
                id="new_subject"
                placeholder="Ex: Bienvenue dans notre newsletter !"
                value={newTemplate.subject}
                onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_preview">Texte d'aperçu</Label>
              <Input
                id="new_preview"
                placeholder="Ex: Découvrez les dernières actualités..."
                value={newTemplate.preview_text}
                onChange={(e) => setNewTemplate({ ...newTemplate, preview_text: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Variables disponibles</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: prenom, nom, email"
                  value={newVariable}
                  onChange={(e) => setNewVariable(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addVariable()}
                />
                <Button type="button" onClick={addVariable} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {newTemplate.variables.map((variable) => (
                  <Badge key={variable} variant="secondary" className="gap-1">
                    {variable}
                    <button
                      type="button"
                      onClick={() => removeVariable(variable)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Ajoutez les variables que vous utiliserez dans le template (ex: nom, prenom, email)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_html_body">Corps du mail</Label>
              <ReactQuill
                theme="snow"
                value={newTemplate.html_body}
                onChange={(value) => setNewTemplate({ ...newTemplate, html_body: value })}
                modules={modules}
                className="bg-background"
                style={{ height: "300px", marginBottom: "50px" }}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateTemplate} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer le template"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce template ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le template sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
