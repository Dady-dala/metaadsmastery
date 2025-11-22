import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { GripVertical, Edit, Trash2, Plus, Eye, EyeOff, Save } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LandingSection {
  id: string;
  section_type: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content: any;
  styles: any;
  media_url: string | null;
  order_index: number;
  is_active: boolean;
}

const LandingPageEditor = () => {
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<LandingSection | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error('Erreur lors du chargement des sections');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order_index for all items
    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index + 1,
    }));

    setSections(updatedItems);

    try {
      // Update order in database
      for (const item of updatedItems) {
        await supabase
          .from('landing_page_sections')
          .update({ order_index: item.order_index })
          .eq('id', item.id);
      }
      toast.success('Ordre des sections mis à jour');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erreur lors de la mise à jour');
      fetchSections(); // Revert on error
    }
  };

  const toggleSectionActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('landing_page_sections')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      setSections(sections.map(s => 
        s.id === id ? { ...s, is_active: !currentStatus } : s
      ));
      toast.success(currentStatus ? 'Section désactivée' : 'Section activée');
    } catch (error) {
      console.error('Error toggling section:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const openEditDialog = (section: LandingSection) => {
    setEditingSection(section);
    setIsDialogOpen(true);
  };

  const handleSaveSection = async () => {
    if (!editingSection) return;

    try {
      const { error } = await supabase
        .from('landing_page_sections')
        .update({
          title: editingSection.title,
          subtitle: editingSection.subtitle,
          content: editingSection.content,
          styles: editingSection.styles,
          media_url: editingSection.media_url,
        })
        .eq('id', editingSection.id);

      if (error) throw error;

      setSections(sections.map(s => 
        s.id === editingSection.id ? editingSection : s
      ));
      setIsDialogOpen(false);
      toast.success('Section mise à jour');
    } catch (error) {
      console.error('Error updating section:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const deleteSection = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette section ?')) return;

    try {
      const { error } = await supabase
        .from('landing_page_sections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSections(sections.filter(s => s.id !== id));
      toast.success('Section supprimée');
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Éditeur de Page de Vente</h2>
          <p className="text-muted-foreground mt-2">
            Gérez les sections de votre page de vente avec drag & drop
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une Section
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {sections.map((section, index) => (
                <Draggable
                  key={section.id}
                  draggableId={section.id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`p-4 ${
                        snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''
                      } ${!section.is_active ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                              {section.section_type}
                            </span>
                            {!section.is_active && (
                              <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
                                Désactivée
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold mt-1">{section.title || 'Sans titre'}</h3>
                          {section.subtitle && (
                            <p className="text-sm text-muted-foreground">{section.subtitle}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleSectionActive(section.id, section.is_active)}
                          >
                            {section.is_active ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(section)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteSection(section.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la Section</DialogTitle>
            <DialogDescription>
              Personnalisez le contenu, les styles et les médias de cette section
            </DialogDescription>
          </DialogHeader>

          {editingSection && (
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Contenu</TabsTrigger>
                <TabsTrigger value="styles">Styles</TabsTrigger>
                <TabsTrigger value="media">Médias</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={editingSection.title || ''}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Sous-titre</Label>
                  <Input
                    id="subtitle"
                    value={editingSection.subtitle || ''}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, subtitle: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Contenu (JSON)</Label>
                  <Textarea
                    id="content"
                    value={JSON.stringify(editingSection.content, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setEditingSection({ ...editingSection, content: parsed });
                      } catch (error) {
                        // Invalid JSON, don't update
                      }
                    }}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="styles" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="styles">Styles (JSON)</Label>
                  <Textarea
                    id="styles"
                    value={JSON.stringify(editingSection.styles, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setEditingSection({ ...editingSection, styles: parsed });
                      } catch (error) {
                        // Invalid JSON, don't update
                      }
                    }}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="media_url">URL du Média</Label>
                  <Input
                    id="media_url"
                    value={editingSection.media_url || ''}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, media_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveSection}>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPageEditor;