import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'phone';
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
  const [publicTitle, setPublicTitle] = useState(form?.public_title || '');
  const [publicDescription, setPublicDescription] = useState(form?.public_description || '');
  const [actionType, setActionType] = useState(form?.action_type || 'submission');
  const [targetListId, setTargetListId] = useState<string>(form?.target_list_id || '');
  const [mappingConfig, setMappingConfig] = useState<Record<string, string>>(form?.mapping_config || {});
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
  const [contactLists, setContactLists] = useState<any[]>([]);

  useEffect(() => {
    loadContactLists();
  }, []);

  const loadContactLists = async () => {
    const { data } = await supabase
      .from('contact_lists')
      .select('id, name')
      .order('name');
    setContactLists(data || []);
  };

  // Options de mapping disponibles pour les contacts
  const contactFields = [
    { value: 'email', label: 'Email' },
    { value: 'first_name', label: 'Prénom' },
    { value: 'last_name', label: 'Nom' },
    { value: 'phone', label: 'Téléphone' },
    { value: 'notes', label: 'Notes' },
  ];

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
      toast.error("Erreur", {
        description: "Le titre est obligatoire",
      });
      return;
    }

    if (fields.length === 0) {
      toast.error("Erreur", {
        description: "Ajoutez au moins un champ",
      });
      return;
    }

    try {
      setSaving(true);

      // Nettoyer le mappingConfig pour ne pas stocker les valeurs "none"
      const cleanedMappingConfig: Record<string, string> = {};
      Object.entries(mappingConfig).forEach(([fieldId, value]) => {
        if (value && value !== 'none') {
          cleanedMappingConfig[fieldId] = value;
        }
      });

      const formData = {
        title,
        description,
        public_title: publicTitle,
        public_description: publicDescription,
        fields: fields as any, // Cast to Json type for Supabase
        action_type: actionType,
        mapping_config: cleanedMappingConfig,
        target_list_id: targetListId || null,
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

      toast.success("Succès", {
        description: form ? "Formulaire mis à jour" : "Formulaire créé",
      });

      onSave();
    } catch (error: any) {
      console.error('Error saving form:', error);
      toast.error("Erreur", {
        description: "Impossible de sauvegarder le formulaire",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Nom interne (admin uniquement)</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Formulaire d'inscription newsletter"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Ce nom est visible uniquement dans l'administration
          </p>
        </div>

        <div>
          <Label htmlFor="description">Description interne (optionnelle)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes pour l'équipe"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="publicTitle">Titre visible par les utilisateurs</Label>
          <Input
            id="publicTitle"
            value={publicTitle}
            onChange={(e) => setPublicTitle(e.target.value)}
            placeholder="Ex: Rejoignez notre newsletter"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Ce titre sera affiché aux utilisateurs qui remplissent le formulaire
          </p>
        </div>

        <div>
          <Label htmlFor="publicDescription">Description visible (optionnelle)</Label>
          <Textarea
            id="publicDescription"
            value={publicDescription}
            onChange={(e) => setPublicDescription(e.target.value)}
            placeholder="Décrivez le formulaire pour vos utilisateurs"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="actionType">Action après soumission</Label>
          <Select value={actionType} onValueChange={setActionType}>
            <SelectTrigger id="actionType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="submission">Soumission seulement</SelectItem>
              <SelectItem value="contact">Créer un contact</SelectItem>
              <SelectItem value="both">Soumission + Contact</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {actionType === 'submission' && 'Les données seront stockées comme soumissions de formulaire'}
            {actionType === 'contact' && 'Un nouveau contact sera créé dans votre CRM'}
            {actionType === 'both' && 'Créera à la fois une soumission et un contact'}
          </p>
        </div>

        {(actionType === 'contact' || actionType === 'both') && (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Label>Liste de destination (optionnelle)</Label>
                  <p className="text-sm text-muted-foreground">
                    Choisissez une liste à laquelle ajouter automatiquement les nouveaux contacts
                  </p>
                  <Select value={targetListId} onValueChange={setTargetListId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Aucune liste (contacts uniquement)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucune liste</SelectItem>
                      {contactLists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Label>Mapping des champs vers le CRM</Label>
                  <p className="text-sm text-muted-foreground">
                    Associez les champs de votre formulaire aux colonnes de votre base de contacts
                  </p>
                  {fields.map((field) => (
                    <div key={field.id} className="grid grid-cols-2 gap-3 items-center">
                      <div className="text-sm font-medium">{field.label}</div>
                      <Select
                        value={mappingConfig[field.id] || 'none'}
                        onValueChange={(value) => setMappingConfig({ ...mappingConfig, [field.id]: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Ne pas mapper" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ne pas mapper</SelectItem>
                          {contactFields.map((cf) => (
                            <SelectItem key={cf.value} value={cf.value}>
                              {cf.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

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
                          <SelectItem value="phone">Téléphone</SelectItem>
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
