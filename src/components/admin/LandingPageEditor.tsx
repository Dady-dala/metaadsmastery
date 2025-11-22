import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { GripVertical, Edit, Trash2, Plus, Eye, EyeOff, Save, Download, Upload, Monitor } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WidgetRenderer } from '@/components/landing/WidgetRenderer';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  const [newWidgetType, setNewWidgetType] = useState('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const widgetTypes = [
    { value: 'hero', label: 'Hero' },
    { value: 'text', label: 'Texte' },
    { value: 'video', label: 'Vidéo' },
    { value: 'cta', label: 'Appel à l\'action' },
    { value: 'carousel', label: 'Carrousel d\'images' },
    { value: 'stats_counter', label: 'Compteur de statistiques' },
    { value: 'benefits', label: 'Section bénéfices' },
  ];

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

  const addNewWidget = async () => {
    try {
      const newSection = {
        section_type: newWidgetType,
        section_key: `${newWidgetType}_${Date.now()}`,
        title: 'Nouveau widget',
        subtitle: 'Cliquez pour éditer',
        content: getDefaultContent(newWidgetType),
        styles: { background: 'bg-background', text_color: 'text-foreground' },
        order_index: sections.length + 1,
        is_active: true,
      };

      const { data, error } = await supabase
        .from('landing_page_sections')
        .insert(newSection)
        .select()
        .single();

      if (error) throw error;

      setSections([...sections, data]);
      setIsAddingWidget(false);
      toast.success('Widget ajouté');
    } catch (error) {
      console.error('Error adding widget:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'carousel':
        return { images: [{ url: '', alt: 'Image 1' }] };
      case 'stats_counter':
        return { stats: [{ value: '100+', label: 'Étudiants', icon: 'users' }] };
      case 'benefits':
        return { benefits: [{ title: 'Bénéfice 1', description: 'Description' }] };
      case 'cta':
        return { cta_text: 'Commencer', price_original: '229', price_promo: '49.99' };
      default:
        return {};
    }
  };

  const exportConfiguration = () => {
    const config = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      sections: sections,
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `landing-page-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Configuration exportée');
  };

  const importConfiguration = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const config = JSON.parse(text);

      if (!config.sections || !Array.isArray(config.sections)) {
        throw new Error('Format de fichier invalide');
      }

      if (!confirm('Cette opération remplacera toutes les sections existantes. Continuer ?')) {
        return;
      }

      // Delete existing sections
      for (const section of sections) {
        await supabase.from('landing_page_sections').delete().eq('id', section.id);
      }

      // Insert imported sections
      const sectionsToInsert = config.sections.map((s: any) => ({
        section_type: s.section_type,
        section_key: s.section_key,
        title: s.title,
        subtitle: s.subtitle,
        content: s.content,
        styles: s.styles,
        media_url: s.media_url,
        order_index: s.order_index,
        is_active: s.is_active,
      }));

      const { data, error } = await supabase
        .from('landing_page_sections')
        .insert(sectionsToInsert)
        .select();

      if (error) throw error;

      setSections(data || []);
      toast.success('Configuration importée');
    } catch (error) {
      console.error('Error importing config:', error);
      toast.error('Erreur lors de l\'importation');
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Éditeur de Page de Vente</h2>
          <p className="text-muted-foreground mt-2">
            Gérez les sections de votre page de vente avec drag & drop
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
            <Monitor className="mr-2 h-4 w-4" />
            Prévisualiser
          </Button>
          <Button variant="outline" onClick={exportConfiguration}>
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={importConfiguration}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Importer
          </Button>
          <Button onClick={() => setIsAddingWidget(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter Widget
          </Button>
        </div>
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

      {/* Add Widget Dialog */}
      <Dialog open={isAddingWidget} onOpenChange={setIsAddingWidget}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un Widget</DialogTitle>
            <DialogDescription>
              Choisissez le type de widget à ajouter à votre page
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type de Widget</Label>
              <Select value={newWidgetType} onValueChange={setNewWidgetType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {widgetTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsAddingWidget(false)}>
              Annuler
            </Button>
            <Button onClick={addNewWidget}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Sheet */}
      <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Prévisualisation de la Page</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {sections
              .filter((s) => s.is_active)
              .sort((a, b) => a.order_index - b.order_index)
              .map((section) => (
                <WidgetRenderer key={section.id} section={section} />
              ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default LandingPageEditor;