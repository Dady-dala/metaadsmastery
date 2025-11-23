import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Mail, Save, Eye } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gestion des Templates Email</h2>
        <p className="text-muted-foreground">
          Personnalisez les emails envoyés automatiquement aux prospects et étudiants
        </p>
      </div>

      <Tabs
        value={selectedTemplate?.template_key}
        onValueChange={(value) => {
          const template = templates.find((t) => t.template_key === value);
          if (template) setSelectedTemplate(template);
        }}
      >
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          {templates.map((template) => (
            <TabsTrigger key={template.id} value={template.template_key}>
              <Mail className="h-4 w-4 mr-2" />
              {templateLabels[template.template_key]}
            </TabsTrigger>
          ))}
        </TabsList>

        {templates.map((template) => (
          <TabsContent key={template.id} value={template.template_key}>
            <Card>
              <CardHeader>
                <CardTitle>{templateLabels[template.template_key]}</CardTitle>
                <CardDescription>
                  Variables disponibles: {template.variables.join(", ")}
                </CardDescription>
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="html_body">Corps du mail</Label>
                    <span className="text-xs text-muted-foreground">
                      Variables: {template.variables.join(", ")}
                    </span>
                  </div>
                  <Textarea
                    id="html_body"
                    placeholder="Écrivez le contenu de votre email en HTML..."
                    value={selectedTemplate?.html_body || ""}
                    onChange={(e) =>
                      selectedTemplate &&
                      setSelectedTemplate({
                        ...selectedTemplate,
                        html_body: e.target.value,
                      })
                    }
                    rows={20}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Utilisez du HTML pour formater votre email. Les variables entre accolades {"{}"} seront remplacées automatiquement.
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
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
