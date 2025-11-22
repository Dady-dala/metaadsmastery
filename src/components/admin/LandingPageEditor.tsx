import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Layout, 
  Type, 
  Video, 
  MousePointerClick, 
  Image as ImageIcon, 
  BarChart3, 
  Gift, 
  Edit, 
  Trash2, 
  Download, 
  Upload,
  Save
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WidgetRenderer } from '@/components/landing/WidgetRenderer';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const widgetTypes = [
    { value: 'hero', label: 'Hero', icon: Layout },
    { value: 'text', label: 'Texte', icon: Type },
    { value: 'video', label: 'Vidéo', icon: Video },
    { value: 'cta', label: 'CTA', icon: MousePointerClick },
    { value: 'carousel', label: 'Carrousel', icon: ImageIcon },
    { value: 'stats_counter', label: 'Statistiques', icon: BarChart3 },
    { value: 'benefits', label: 'Bénéfices', icon: Gift },
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

  const addNewWidget = async (widgetType: string) => {
    try {
      const newSection = {
        section_type: widgetType,
        section_key: `${widgetType}_${Date.now()}`,
        title: 'Nouveau widget',
        subtitle: 'Cliquez pour éditer',
        content: getDefaultContent(widgetType),
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
    <div className="h-full flex">
      {/* Left Sidebar - Widget Palette */}
      <div className="w-64 border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-sm">Widgets</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Cliquez pour ajouter
          </p>
        </div>
        
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="p-4 space-y-2">
            {widgetTypes.map((widget) => {
              const Icon = widget.icon;
              return (
                <button
                  key={widget.value}
                  onClick={() => addNewWidget(widget.value)}
                  className="w-full p-3 rounded-lg border border-border bg-background hover:bg-accent hover:border-primary transition-all flex items-center gap-3 group"
                >
                  <div className="p-2 rounded bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{widget.label}</span>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border space-y-2">
          <Button variant="outline" size="sm" className="w-full" onClick={exportConfiguration}>
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
          <Button variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Importer
          </Button>
        </div>
      </div>

      {/* Right Side - Live Preview */}
      <div className="flex-1 bg-muted/30">
        <div className="p-4 border-b border-border bg-card flex justify-between items-center">
          <div>
            <h3 className="font-semibold">Prévisualisation en direct</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Survolez pour éditer ou supprimer
            </p>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Layout className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground font-medium">Aucun widget ajouté</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cliquez sur un widget à gauche pour commencer
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {sections
                  .filter((s) => s.is_active)
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((section) => (
                    <div
                      key={section.id}
                      className="relative group"
                      onMouseEnter={() => setHoveredSection(section.id)}
                      onMouseLeave={() => setHoveredSection(null)}
                    >
                      {/* Section Controls Overlay */}
                      {hoveredSection === section.id && (
                        <div className="absolute top-2 right-2 z-10 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openEditDialog(section)}
                            className="shadow-lg"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Éditer
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteSection(section.id)}
                            className="shadow-lg"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      )}
                      
                      {/* Widget Preview with hover effect */}
                      <div className={`rounded-lg border-2 transition-all ${
                        hoveredSection === section.id 
                          ? 'border-primary shadow-lg' 
                          : 'border-transparent'
                      }`}>
                        <WidgetRenderer section={section} />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

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