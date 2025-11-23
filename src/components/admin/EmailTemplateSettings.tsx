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
          content: selectedTemplate.content,
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
    
    let html = `
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
            .content { padding: 30px; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="${logo}" alt="Meta Ads Mastery" />
            </div>
    `;

    if (template.template_key === "confirmation_email") {
      html += `
            <div class="header">
              <h1>🎉 ${template.content.header_title}</h1>
              <p>${template.content.header_subtitle}</p>
            </div>
            <div class="content">
              <p>${template.content.greeting}</p>
              <h3>${template.content.promise_title}</h3>
              <ul>
                ${template.content.promise_items.map((item: string) => `<li>${item}</li>`).join("")}
              </ul>
            </div>
      `;
    } else if (template.template_key === "course_assignment") {
      html += `
            <div class="header">
              <h1>${template.content.header_title}</h1>
              <p>${template.content.header_subtitle}</p>
            </div>
            <div class="content">
              <p>${template.content.intro}</p>
              <h3>${template.content.tips_title}</h3>
              <ul>
                ${template.content.tips_items.map((item: string) => `<li>${item}</li>`).join("")}
              </ul>
            </div>
      `;
    }

    html += `
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
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Sujet de l'email</Label>
                  <Input
                    id="subject"
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

                <div className="space-y-4">
                  {Object.entries(selectedTemplate?.content || {}).map(([key, value]) => {
                    if (Array.isArray(value)) {
                      return (
                        <div key={key} className="space-y-2">
                          <Label>{key.replace(/_/g, " ").toUpperCase()}</Label>
                          {value.map((item, index) => (
                            <Input
                              key={index}
                              value={item}
                              onChange={(e) => {
                                if (!selectedTemplate) return;
                                const newContent = { ...selectedTemplate.content };
                                newContent[key][index] = e.target.value;
                                setSelectedTemplate({
                                  ...selectedTemplate,
                                  content: newContent,
                                });
                              }}
                            />
                          ))}
                        </div>
                      );
                    }

                    if (typeof value === "string") {
                      const isLongText = value.length > 100;
                      return (
                        <div key={key} className="space-y-2">
                          <Label htmlFor={key}>
                            {key.replace(/_/g, " ").toUpperCase()}
                          </Label>
                          {isLongText ? (
                            <Textarea
                              id={key}
                              value={value}
                              rows={4}
                              onChange={(e) => {
                                if (!selectedTemplate) return;
                                setSelectedTemplate({
                                  ...selectedTemplate,
                                  content: {
                                    ...selectedTemplate.content,
                                    [key]: e.target.value,
                                  },
                                });
                              }}
                            />
                          ) : (
                            <Input
                              id={key}
                              value={value}
                              onChange={(e) => {
                                if (!selectedTemplate) return;
                                setSelectedTemplate({
                                  ...selectedTemplate,
                                  content: {
                                    ...selectedTemplate.content,
                                    [key]: e.target.value,
                                  },
                                });
                              }}
                            />
                          )}
                        </div>
                      );
                    }

                    return null;
                  })}
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
