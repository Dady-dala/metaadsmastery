import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Pencil, Trash2, Eye, EyeOff, Lock, ExternalLink } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { WidgetRenderer } from '@/components/landing/WidgetRenderer';

interface Page {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  is_active: boolean;
  is_system_page: boolean;
  created_at: string;
  sectionsCount?: number;
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

const PageManagement = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [previewPage, setPreviewPage] = useState<Page | null>(null);
  const [previewSections, setPreviewSections] = useState<LandingSection[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    meta_description: '',
    is_active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const { data: pagesData, error } = await supabase
        .from('pages')
        .select('*')
        .order('slug');

      if (error) throw error;
      
      // Load section counts for each page
      const pagesWithCounts = await Promise.all(
        (pagesData || []).map(async (page) => {
          const sectionKey = page.slug === '/' ? 'home_%' : `${page.slug.replace('/', '')}_%`;
          const { count } = await supabase
            .from('landing_page_sections')
            .select('*', { count: 'exact', head: true })
            .like('section_key', sectionKey);
          
          return { ...page, sectionsCount: count || 0 };
        })
      );
      
      setPages(pagesWithCounts);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openPreview = async (page: Page) => {
    setPreviewPage(page);
    setPreviewDialogOpen(true);
    setLoadingPreview(true);
    
    try {
      const sectionKey = page.slug === '/' ? 'home_%' : `${page.slug.replace('/', '')}_%`;
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('*')
        .like('section_key', sectionKey)
        .order('order_index');
      
      if (error) throw error;
      setPreviewSections(data || []);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPage) {
        const { error } = await supabase
          .from('pages')
          .update({
            title: formData.title,
            meta_description: formData.meta_description,
            is_active: formData.is_active,
          })
          .eq('id', editingPage.id);

        if (error) throw error;
        toast({ title: 'Page mise à jour avec succès' });
      } else {
        const { error } = await supabase
          .from('pages')
          .insert({
            slug: formData.slug,
            title: formData.title,
            meta_description: formData.meta_description,
            is_active: formData.is_active,
            is_system_page: false,
          });

        if (error) throw error;
        toast({ title: 'Page créée avec succès' });
      }

      setDialogOpen(false);
      setEditingPage(null);
      resetForm();
      loadPages();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (page: Page) => {
    if (page.is_system_page) {
      toast({
        title: 'Action non autorisée',
        description: 'Les pages système ne peuvent pas être supprimées',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Supprimer la page "${page.title}" ?`)) return;

    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', page.id);

      if (error) throw error;
      toast({ title: 'Page supprimée avec succès' });
      loadPages();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const togglePageStatus = async (page: Page) => {
    try {
      const { error } = await supabase
        .from('pages')
        .update({ is_active: !page.is_active })
        .eq('id', page.id);

      if (error) throw error;
      toast({
        title: page.is_active ? 'Page désactivée' : 'Page activée',
      });
      loadPages();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (page: Page) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      meta_description: page.meta_description || '',
      is_active: page.is_active,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingPage(null);
    resetForm();
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      slug: '',
      title: '',
      meta_description: '',
      is_active: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des pages</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez toutes les pages de votre site
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle page
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Sections</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => (
              <TableRow key={page.id}>
                <TableCell className="font-medium">
                  <button
                    onClick={() => openPreview(page)}
                    className="flex items-center gap-2 hover:text-primary transition-colors text-left w-full"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="hover:underline">{page.title}</span>
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </button>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {page.slug}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {page.sectionsCount || 0} section{(page.sectionsCount || 0) !== 1 ? 's' : ''}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {page.is_active ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <Eye className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-muted-foreground text-sm">
                        <EyeOff className="w-3 h-3" />
                        Inactive
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {page.is_system_page ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="w-3 h-3" />
                      Système
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Personnalisée
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePageStatus(page)}
                    >
                      {page.is_active ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(page)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {!page.is_system_page && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(page)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingPage ? 'Modifier la page' : 'Nouvelle page'}
              </DialogTitle>
              <DialogDescription>
                {editingPage
                  ? 'Modifiez les informations de la page'
                  : 'Créez une nouvelle page pour votre site'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="slug">
                  URL slug {editingPage?.is_system_page && '(non modifiable)'}
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="ma-page"
                  required
                  disabled={!!editingPage}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.slug ? `/${formData.slug}` : '/ma-page'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Titre de la page</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ma Page"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">
                  Description (SEO)
                </Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      meta_description: e.target.value,
                    })
                  }
                  placeholder="Description de la page pour les moteurs de recherche"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Page active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {editingPage ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {previewPage?.title}
            </DialogTitle>
            <DialogDescription>
              Aperçu du contenu de la page - {previewSections.length} section{previewSections.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {loadingPreview ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Chargement...</div>
              </div>
            ) : previewSections.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Aucune section pour cette page</p>
                <p className="text-sm mt-2">Ajoutez du contenu via l'éditeur de contenu</p>
              </div>
            ) : (
              previewSections.map((section, index) => (
                <Card key={section.id} className="border-2">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="inline-block px-3 py-1 text-xs rounded-md bg-primary/10 text-primary font-medium">
                          {section.section_type}
                        </span>
                        <span className="text-sm text-muted-foreground">Section #{index + 1}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {section.title && (
                        <h3 className="text-xl font-semibold">{section.title}</h3>
                      )}
                      {section.subtitle && (
                        <p className="text-muted-foreground">{section.subtitle}</p>
                      )}
                      {section.content && Object.keys(section.content as object).length > 0 && (
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Contenu JSON:</p>
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(section.content, null, 2)}
                          </pre>
                        </div>
                      )}
                      {section.media_url && (
                        <div className="bg-muted/30 p-3 rounded">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Média:</p>
                          <a 
                            href={section.media_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline break-all"
                          >
                            {section.media_url}
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PageManagement;