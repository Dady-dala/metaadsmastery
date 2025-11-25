import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import SEO from "@/components/SEO";
import { PhoneInput } from "@/components/PhoneInput";

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'phone';
  required: boolean;
  options?: string[];
}

interface Form {
  id: string;
  title: string;
  description: string | null;
  public_title: string | null;
  public_description: string | null;
  fields: FormField[];
  is_active: boolean;
}

export default function PublicFormView() {
  const { formId } = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadForm();
  }, [formId]);

  const loadForm = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast.error("Erreur", {
          description: "Formulaire introuvable ou inactif",
        });
        return;
      }

      // Cast fields to FormField[] type
      const formWithTypedFields: Form = {
        ...data,
        fields: data.fields as any as FormField[]
      };
      
      setForm(formWithTypedFields);
      
      // Initialize form data with proper type casting
      const initialData: Record<string, any> = {};
      const fields = formWithTypedFields.fields;
      if (Array.isArray(fields)) {
        fields.forEach((field: FormField) => {
          if (field.type === 'checkbox') {
            initialData[field.id] = false;
          } else if (field.type === 'phone') {
            initialData[field.id] = '+243';
          } else {
            initialData[field.id] = '';
          }
        });
      }
      setFormData(initialData);
    } catch (error: any) {
      console.error('Error loading form:', error);
      toast.error("Erreur", {
        description: "Impossible de charger le formulaire",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form) return;

    // Validate required fields
    const fields = form.fields as any as FormField[];
    const requiredFields = fields.filter(f => f.required);
    for (const field of requiredFields) {
      if (!formData[field.id] || formData[field.id] === '') {
        toast.error("Erreur", {
          description: `Le champ "${field.label}" est obligatoire`,
        });
        return;
      }
    }

    try {
      setSubmitting(true);

      // Call the Edge Function to handle form submission
      const { data: result, error } = await supabase.functions.invoke('submit-form', {
        body: {
          formId: form.id,
          data: formData,
        },
      });

      if (error) throw error;

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la soumission');
      }

      setSubmitted(true);
      toast.success("Succès", {
        description: "Formulaire soumis avec succès",
      });
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast.error("Erreur", {
        description: error.message || "Impossible de soumettre le formulaire",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Formulaire introuvable</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <>
        <SEO 
          title={form.public_title || form.title} 
          description={form.public_description || form.description || ''} 
        />
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <h2 className="text-2xl font-bold">Merci !</h2>
              <p className="text-muted-foreground">
                Votre formulaire a été soumis avec succès. Nous vous contacterons bientôt.
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title={form.public_title || form.title} 
        description={form.public_description || form.description || ''} 
      />
      <div className="min-h-screen bg-background p-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{form.public_title || form.title}</CardTitle>
              {(form.public_description || form.description) && (
                <CardDescription>{form.public_description || form.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {((form.fields as any) as FormField[]).map((field) => (
                  <div key={field.id}>
                    <Label htmlFor={field.id}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    
                    {field.type === 'text' && (
                      <Input
                        id={field.id}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        required={field.required}
                        className="mt-2"
                      />
                    )}

                    {field.type === 'email' && (
                      <Input
                        id={field.id}
                        type="email"
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        required={field.required}
                        className="mt-2"
                      />
                    )}

                    {field.type === 'phone' && (
                      <PhoneInput
                        id={field.id}
                        value={formData[field.id] || ''}
                        onChange={(value) => handleFieldChange(field.id, value)}
                        required={field.required}
                      />
                    )}

                    {field.type === 'textarea' && (
                      <Textarea
                        id={field.id}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        required={field.required}
                        rows={4}
                        className="mt-2"
                      />
                    )}

                    {field.type === 'checkbox' && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          id={field.id}
                          checked={formData[field.id] || false}
                          onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                          required={field.required}
                          className="rounded"
                        />
                        <Label htmlFor={field.id} className="cursor-pointer font-normal">
                          {field.label}
                        </Label>
                      </div>
                    )}
                  </div>
                ))}

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    'Envoyer'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
