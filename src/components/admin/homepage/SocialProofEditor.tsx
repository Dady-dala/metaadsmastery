import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Loader2, Upload, X, GripVertical, Edit } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ImageEditor } from '@/components/admin/ImageEditor';

interface SocialProofImage {
  url: string;
  caption?: string;
  order: number;
  file_path?: string;
}

interface Props {
  onSave?: () => void;
}

export const SocialProofEditor = ({ onSave }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<SocialProofImage[]>([]);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<File | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('*')
        .eq('section_key', 'social-proof')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSectionId(data.id);
        const content = data.content as any || {};
        setImages(content.proofs || content.images || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }

    // Open image editor
    setPendingImageFile(file);
    setEditingImage(file);
  };

  const handleImageEdited = async (editedBlob: Blob) => {
    setUploading(true);
    try {
      const fileName = `${Date.now()}.png`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('social-proof')
        .upload(filePath, editedBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('social-proof')
        .getPublicUrl(filePath);

      const newImage: SocialProofImage = {
        url: publicUrl,
        caption: '',
        order: images.length,
        file_path: filePath
      };

      setImages([...images, newImage]);
      toast.success('Image uploadée avec succès');
      setEditingImage(null);
      setPendingImageFile(null);
    } catch (error: any) {
      console.error('Erreur upload:', error);
      toast.error('Erreur lors de l\'upload de l\'image');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingImage(null);
    setPendingImageFile(null);
  };

  const handleRemoveImage = async (index: number) => {
    const image = images[index];
    
    try {
      // Delete from storage if file_path exists
      if (image.file_path) {
        await supabase.storage
          .from('social-proof')
          .remove([image.file_path]);
      }

      const newImages = images.filter((_, i) => i !== index);
      // Reorder
      const reorderedImages = newImages.map((img, i) => ({ ...img, order: i }));
      setImages(reorderedImages);
      toast.success('Image supprimée');
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleCaptionChange = (index: number, caption: string) => {
    const newImages = [...images];
    newImages[index].caption = caption;
    setImages(newImages);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order
    const reorderedImages = items.map((img, index) => ({ ...img, order: index }));
    setImages(reorderedImages);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        window.location.href = '/auth';
        return;
      }

      const payload = {
        section_key: 'social-proof',
        section_type: 'social-proof',
        title: 'Preuves Sociales',
        content: {
          proofs: images
        } as any,
        is_active: true,
        order_index: 4
      };

      let error;
      if (sectionId) {
        ({ error } = await supabase
          .from('landing_page_sections')
          .update(payload)
          .eq('id', sectionId));
      } else {
        const { data, error: insertError } = await supabase
          .from('landing_page_sections')
          .insert(payload)
          .select('id')
          .single();
        
        error = insertError;
        if (data) setSectionId(data.id);
      }

      if (error) throw error;

      toast.success('Preuves sociales enregistrées');
      onSave?.();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (editingImage) {
    return (
      <ImageEditor
        imageFile={editingImage}
        onSave={handleImageEdited}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-foreground">Ajouter une Image</Label>
        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="bg-background border-border text-foreground"
          />
          {uploading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
        </div>
        <p className="text-sm text-muted-foreground">
          L'image sera ouverte dans l'éditeur pour recadrage et filtres avant upload
        </p>
      </div>

      {images.length > 0 && (
        <div className="space-y-4">
          <Label className="text-foreground">Images ({images.length})</Label>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="images">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {images.map((image, index) => (
                    <Draggable key={index} draggableId={String(index)} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-move pt-2"
                          >
                            <GripVertical className="w-5 h-5 text-muted-foreground" />
                          </div>
                          
                          <img
                            src={image.url}
                            alt={`Preview ${index + 1}`}
                            className="w-20 h-20 object-cover rounded"
                          />
                          
                          <div className="flex-1 space-y-2">
                            <Input
                              placeholder="Légende (optionnelle)"
                              value={image.caption || ''}
                              onChange={(e) => handleCaptionChange(index, e.target.value)}
                              className="bg-background border-border"
                            />
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveImage(index)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={saving || images.length === 0}
        className="w-full"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Enregistrement...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Enregistrer les Preuves Sociales
          </>
        )}
      </Button>
    </div>
  );
};
