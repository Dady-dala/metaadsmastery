import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  options?: string[];
}

interface FormEditorProps {
  form: any | null;
  onSave: () => void;
  onCancel: () => void;
}

export function FormEditor({ form, onSave, onCancel }: FormEditorProps) {
  const [title, setTitle] = useState(form?.title || '');
  const [description, setDescription] = useState(form?.description || '');
  const [fields, setFields] = useState<FormField[]>(
    form?.fields || [
      {
        id: crypto.randomUUID(),
        label: 'Email',
        type: 'email',
        required: true,
      }
    ]
  );
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        id: crypto.randomUUID(),
        label: 'Nouveau champ',
        type: 'text',
        required: false,
      }
    ]);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleUpdateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleSave = async () => {
    if (!title) {
      toast({
        title: "Erreur",
        description: "Le titre est obligatoire",
        variant: "destructive",
      });
      return;
    }

    if (fields.length === 0) {
      toast({
        title: "Erreur",
        description: "Ajoutez au moins un champ",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const formData = {
        title,
        description,
        fields: fields as any, // Cast to Json type for Supabase
      };

      if (form) {
        const { error } = await supabase
          .from('forms')
          .update(formData)
          .eq('id', form.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('forms')
          .insert([formData]);

        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: form ? "Formulaire mis à jour" : "Formulaire créé",
      });

      onSave();
    } catch (error: any) {
      console.error('Error saving form:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le formulaire",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Titre du formulaire</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Formulaire d'inscription newsletter"
          />
        </div>

        <div>
          <Label htmlFor="description">Description (optionnelle)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez le but de ce formulaire"
            rows={3}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Champs du formulaire</Label>
            <Button onClick={handleAddField} size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un champ
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Champ {index + 1}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveField(field.id)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <Label>Label</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                        placeholder="Ex: Nom"
                      />
                    </div>

                    <div>
                      <Label>Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) => handleUpdateField(field.id, { type: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texte</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="textarea">Zone de texte</SelectItem>
                          <SelectItem value="select">Liste déroulante</SelectItem>
                          <SelectItem value="checkbox">Case à cocher</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`required-${field.id}`}
                        checked={field.required}
                        onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor={`required-${field.id}`} className="cursor-pointer">
                        Champ obligatoire
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Sauvegarde..." : form ? "Mettre à jour" : "Créer"}
        </Button>
      </div>
    </div>
  );
}
