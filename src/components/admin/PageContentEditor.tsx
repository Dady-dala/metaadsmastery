import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WidgetRenderer } from '@/components/landing/WidgetRenderer';
import { Plus, Edit, Trash2, Eye, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Page {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  is_active: boolean;
}

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

const PageContentEditor = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<LandingSection | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (selectedPage) {
      loadSections(selectedPage.slug);
    }
  }, [selectedPage]);

  const loadPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('is_active', true)
        .order('slug');

      if (error) throw error;
      setPages(data || []);
      if (data && data.length > 0) {
        setSelectedPage(data[0]);
      }
    } catch (error) {
      console.error('Error loading pages:', error);
      toast.error('Erreur lors du chargement des pages');
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async (pageSlug: string) => {
    try {
      const sectionKey = pageSlug === '/' ? 'home_%' : `${pageSlug.replace('/', '')}_%`;
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('*')
        .like('section_key', sectionKey)
        .order('order_index');

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error loading sections:', error);
      toast.error('Erreur lors du chargement des sections');
    }
  };

  const handleSaveSection = async () => {
    if (!editingSection || !selectedPage) return;

    try {
      const sectionData = {
        ...editingSection,
        section_key: editingSection.section_key || `${selectedPage.slug.replace('/', 'home')}_${Date.now()}`,
      };

      if (editingSection.id) {
        const { error } = await supabase
          .from('landing_page_sections')
          .update(sectionData)
          .eq('id', editingSection.id);

        if (error) throw error;
        toast.success('Section mise à jour');
      } else {
        const { error } = await supabase
          .from('landing_page_sections')
          .insert([{ ...sectionData, order_index: sections.length }]);

        if (error) throw error;
        toast.success('Section créée');
      }

      setShowEditDialog(false);
      setEditingSection(null);
      if (selectedPage) loadSections(selectedPage.slug);
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette section ?')) return;

    try {
      const { error } = await supabase
        .from('landing_page_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;
      toast.success('Section supprimée');
      if (selectedPage) loadSections(selectedPage.slug);
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;

    const newSections = Array.from(sections);
    const [removed] = newSections.splice(sourceIndex, 1);
    newSections.splice(destinationIndex, 0, removed);

    // Update order_index for all affected sections
    try {
      const updates = newSections.map((section, index) => 
        supabase
          .from('landing_page_sections')
          .update({ order_index: index })
          .eq('id', section.id)
      );

      await Promise.all(updates);
      setSections(newSections);
      toast.success('Section déplacée');
    } catch (error) {
      console.error('Error moving section:', error);
      toast.error('Erreur lors du déplacement');
    }
  };

  const openEditDialog = (section: LandingSection | null = null) => {
    if (section) {
      setEditingSection(section);
    } else {
      setEditingSection({
        id: '',
        section_type: 'text',
        section_key: '',
        title: '',
        subtitle: '',
        content: {},
        styles: { background: 'bg-background', text_color: 'text-foreground' },
        media_url: null,
        order_index: sections.length,
        is_active: true,
      });
    }
    setShowEditDialog(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Chargement...</div>;
  }

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Éditeur de Contenu par Page</h2>
          <p className="text-muted-foreground mt-1">Gérez le contenu de chaque page de votre site</p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={selectedPage?.id || ''}
            onValueChange={(pageId) => {
              const page = pages.find(p => p.id === pageId);
              if (page) setSelectedPage(page);
            }}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Sélectionner une page" />
            </SelectTrigger>
            <SelectContent>
              {pages.map((page) => (
                <SelectItem key={page.id} value={page.id}>
                  {page.title} ({page.slug})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowPreview(!showPreview)}
            title={showPreview ? 'Masquer l\'aperçu' : 'Afficher l\'aperçu'}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className={`grid ${showPreview ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
        {/* Left Panel - Section Management */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sections</CardTitle>
                <Button onClick={() => openEditDialog()} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une section
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {sections.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune section. Cliquez sur "Ajouter une section" pour commencer.
                </p>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="sections-list">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3"
                      >
                        {sections.map((section, index) => (
                          <Draggable key={section.id} draggableId={section.id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`border-2 ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="cursor-grab active:cursor-grabbing"
                                      >
                                        <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="inline-block px-2 py-1 text-xs rounded-md bg-primary/10 text-primary font-medium">
                                            {section.section_type}
                                          </span>
                                          <span className="text-sm text-muted-foreground">#{index + 1}</span>
                                        </div>
                                        <h4 className="font-medium truncate">{section.title || 'Sans titre'}</h4>
                                        {section.subtitle && (
                                          <p className="text-sm text-muted-foreground truncate mt-1">{section.subtitle}</p>
                                        )}
                                        {section.content && Object.keys(section.content as object).length > 0 && (
                                          <div className="mt-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                                            <strong>Contenu:</strong> {JSON.stringify(section.content).substring(0, 100)}...
                                          </div>
                                        )}
                                        {section.media_url && (
                                          <div className="mt-2 text-xs text-muted-foreground">
                                            <strong>Média:</strong> {section.media_url.substring(0, 50)}...
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
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
                                        onClick={() => handleDeleteSection(section.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Live Preview */}
        {showPreview && (
          <div className="space-y-4 sticky top-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Aperçu en Direct
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden bg-background">
                  <div className="h-[600px] overflow-y-auto">
                    {sections.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Aucune section à afficher
                      </div>
                    ) : (
                      sections.map((section) => (
                        <div key={section.id} className="border-b last:border-b-0">
                          <WidgetRenderer section={section} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSection?.id ? 'Modifier la section' : 'Nouvelle section'}
            </DialogTitle>
          </DialogHeader>

          {editingSection && (
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Contenu</TabsTrigger>
                <TabsTrigger value="styles">Styles</TabsTrigger>
                <TabsTrigger value="advanced">Avancé</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 mt-4">
                <div>
                  <Label>Type de section</Label>
                  <Select
                    value={editingSection.section_type}
                    onValueChange={(value) =>
                      setEditingSection({ ...editingSection, section_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero">Hero</SelectItem>
                      <SelectItem value="text">Texte</SelectItem>
                      <SelectItem value="video">Vidéo</SelectItem>
                      <SelectItem value="cta">Call to Action</SelectItem>
                      <SelectItem value="carousel">Carousel d'images</SelectItem>
                      <SelectItem value="stats_counter">Compteur de statistiques</SelectItem>
                      <SelectItem value="benefits">Liste d'avantages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Titre</Label>
                  <Input
                    value={editingSection.title || ''}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, title: e.target.value })
                    }
                    placeholder="Titre de la section"
                  />
                </div>

                <div>
                  <Label>Sous-titre</Label>
                  <Input
                    value={editingSection.subtitle || ''}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, subtitle: e.target.value })
                    }
                    placeholder="Sous-titre (optionnel)"
                  />
                </div>

                <div>
                  <Label>Contenu (JSON)</Label>
                  <Textarea
                    value={JSON.stringify(editingSection.content, null, 2)}
                    onChange={(e) => {
                      try {
                        const content = JSON.parse(e.target.value);
                        setEditingSection({ ...editingSection, content });
                      } catch (err) {
                        // Invalid JSON, ignore
                      }
                    }}
                    placeholder='{"cta_text": "Commencer maintenant"}'
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>

                {editingSection.section_type === 'video' && (
                  <div>
                    <Label>URL de la vidéo</Label>
                    <Input
                      value={editingSection.media_url || ''}
                      onChange={(e) =>
                        setEditingSection({ ...editingSection, media_url: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="styles" className="space-y-4 mt-4">
                <div>
                  <Label>Classe de fond (Tailwind)</Label>
                  <Input
                    value={editingSection.styles?.background || ''}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        styles: { ...editingSection.styles, background: e.target.value },
                      })
                    }
                    placeholder="bg-background"
                  />
                </div>

                <div>
                  <Label>Classe de couleur de texte (Tailwind)</Label>
                  <Input
                    value={editingSection.styles?.text_color || ''}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        styles: { ...editingSection.styles, text_color: e.target.value },
                      })
                    }
                    placeholder="text-foreground"
                  />
                </div>

                <div>
                  <Label>Autres styles (JSON)</Label>
                  <Textarea
                    value={JSON.stringify(editingSection.styles || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const styles = JSON.parse(e.target.value);
                        setEditingSection({ ...editingSection, styles });
                      } catch (err) {
                        // Invalid JSON, ignore
                      }
                    }}
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 mt-4">
                <div>
                  <Label>Clé de section</Label>
                  <Input
                    value={editingSection.section_key}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, section_key: e.target.value })
                    }
                    placeholder="Auto-généré si vide"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Identifiant unique de la section (auto-généré si non spécifié)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editingSection.is_active}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, is_active: e.target.checked })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="is_active">Section active</Label>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveSection}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PageContentEditor;
