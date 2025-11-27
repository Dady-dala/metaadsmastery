import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Trash2, Plus, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { HeroSectionEditor } from './homepage/HeroSectionEditor';
import { ServicesSectionEditor } from './homepage/ServicesSectionEditor';
import { TestimonialsSectionEditor } from './homepage/TestimonialsSectionEditor';
import { FAQSectionEditor } from './homepage/FAQSectionEditor';
import { SocialProofEditor } from './homepage/SocialProofEditor';
import { BonusPricingEditor } from './homepage/BonusPricingEditor';
import { LivePreview } from './homepage/LivePreview';

export const HomePageManagement = () => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des sections:', error);
      toast.error('Erreur lors du chargement des sections');
    } finally {
      setLoading(false);
    }
  };

  const refreshPreview = () => {
    setPreviewKey(prev => prev + 1);
    loadSections();
  };

  const handleDeleteSection = async (sectionKey: string) => {
    try {
      const { error } = await supabase
        .from('landing_page_sections')
        .delete()
        .eq('section_key', sectionKey);

      if (error) throw error;

      toast.success('Section supprimée avec succès');
      loadSections();
      refreshPreview();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de la section');
    } finally {
      setDeleteDialogOpen(false);
      setSectionToDelete(null);
    }
  };

  const handleRecreateSection = async (sectionKey: string) => {
    try {
      const sectionDefaults: Record<string, any> = {
        'hero': {
          section_key: 'hero',
          section_type: 'hero',
          title: 'Nouveau Titre Hero',
          subtitle: 'Nouveau sous-titre',
          content: { subtitle2: '', ctaText: 'CTA', logosTitle: '' },
          order_index: 0,
          is_active: true
        },
        'services': {
          section_key: 'services',
          section_type: 'services',
          title: 'Services',
          content: { problems: [], learnings: [], modules: [] },
          order_index: 1,
          is_active: true
        },
        'bonus-pricing': {
          section_key: 'bonus-pricing',
          section_type: 'bonus-pricing',
          title: 'Bonus & Pricing',
          content: { bonuses: [], originalPrice: '', discountedPrice: '' },
          order_index: 2,
          is_active: true
        },
        'testimonials': {
          section_key: 'testimonials',
          section_type: 'testimonials',
          title: 'Témoignages',
          content: { testimonials: [] },
          order_index: 3,
          is_active: true
        },
        'social-proof': {
          section_key: 'social-proof',
          section_type: 'social-proof',
          title: 'Preuves Sociales',
          content: { proofs: [] },
          order_index: 4,
          is_active: true
        },
        'faq': {
          section_key: 'faq',
          section_type: 'faq',
          title: 'FAQ',
          content: { faqs: [] },
          order_index: 5,
          is_active: true
        }
      };

      const defaultData = sectionDefaults[sectionKey];
      if (!defaultData) {
        throw new Error('Type de section inconnu');
      }

      const { error } = await supabase
        .from('landing_page_sections')
        .insert(defaultData);

      if (error) throw error;

      toast.success('Section recréée avec succès');
      loadSections();
      refreshPreview();
    } catch (error) {
      console.error('Erreur lors de la recréation:', error);
      toast.error('Erreur lors de la recréation de la section');
    }
  };

  const getSectionDisplayName = (sectionKey: string) => {
    const names: Record<string, string> = {
      'hero': 'Hero',
      'services': 'Services',
      'bonus-pricing': 'Bonus & Prix',
      'testimonials': 'Témoignages',
      'social-proof': 'Preuves Sociales',
      'faq': 'FAQ'
    };
    return names[sectionKey] || sectionKey;
  };

  const sectionExists = (key: string) => sections.some(s => s.section_key === key);

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Gestion de la Page d'Accueil</CardTitle>
              <CardDescription className="text-muted-foreground">
                Modifiez le contenu de toutes les sections de votre page d'accueil
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Masquer l\'aperçu' : 'Afficher l\'aperçu'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Tabs defaultValue="hero" className="w-full">
                <TabsList className="grid w-full grid-cols-6 bg-muted">
                  <TabsTrigger value="hero" disabled={!sectionExists('hero')}>
                    Hero {!sectionExists('hero') && '(Supprimée)'}
                  </TabsTrigger>
                  <TabsTrigger value="services" disabled={!sectionExists('services')}>
                    Services {!sectionExists('services') && '(Supprimée)'}
                  </TabsTrigger>
                  <TabsTrigger value="bonus-pricing" disabled={!sectionExists('bonus-pricing')}>
                    Bonus & Prix {!sectionExists('bonus-pricing') && '(Supprimée)'}
                  </TabsTrigger>
                  <TabsTrigger value="testimonials" disabled={!sectionExists('testimonials')}>
                    Témoignages {!sectionExists('testimonials') && '(Supprimée)'}
                  </TabsTrigger>
                  <TabsTrigger value="social-proof" disabled={!sectionExists('social-proof')}>
                    Preuves {!sectionExists('social-proof') && '(Supprimée)'}
                  </TabsTrigger>
                  <TabsTrigger value="faq" disabled={!sectionExists('faq')}>
                    FAQ {!sectionExists('faq') && '(Supprimée)'}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="hero" className="mt-6 space-y-4">
                  {sectionExists('hero') ? (
                    <>
                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSectionToDelete('hero');
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer cette section
                        </Button>
                      </div>
                      <HeroSectionEditor onSave={refreshPreview} />
                    </>
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed rounded-lg space-y-4">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">Cette section a été supprimée</p>
                      <Button
                        onClick={() => handleRecreateSection('hero')}
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Recréer cette section
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="services" className="mt-6 space-y-4">
                  {sectionExists('services') ? (
                    <>
                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSectionToDelete('services');
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer cette section
                        </Button>
                      </div>
                      <ServicesSectionEditor onSave={refreshPreview} />
                    </>
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed rounded-lg space-y-4">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">Cette section a été supprimée</p>
                      <Button
                        onClick={() => handleRecreateSection('services')}
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Recréer cette section
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="bonus-pricing" className="mt-6 space-y-4">
                  {sectionExists('bonus-pricing') ? (
                    <>
                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSectionToDelete('bonus-pricing');
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer cette section
                        </Button>
                      </div>
                      <BonusPricingEditor onSave={refreshPreview} />
                    </>
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed rounded-lg space-y-4">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">Cette section a été supprimée</p>
                      <Button
                        onClick={() => handleRecreateSection('bonus-pricing')}
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Recréer cette section
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="testimonials" className="mt-6 space-y-4">
                  {sectionExists('testimonials') ? (
                    <>
                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSectionToDelete('testimonials');
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer cette section
                        </Button>
                      </div>
                      <TestimonialsSectionEditor onSave={refreshPreview} />
                    </>
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed rounded-lg space-y-4">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">Cette section a été supprimée</p>
                      <Button
                        onClick={() => handleRecreateSection('testimonials')}
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Recréer cette section
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="social-proof" className="mt-6 space-y-4">
                  {sectionExists('social-proof') ? (
                    <>
                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSectionToDelete('social-proof');
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer cette section
                        </Button>
                      </div>
                      <SocialProofEditor onSave={refreshPreview} />
                    </>
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed rounded-lg space-y-4">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">Cette section a été supprimée</p>
                      <Button
                        onClick={() => handleRecreateSection('social-proof')}
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Recréer cette section
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="faq" className="mt-6 space-y-4">
                  {sectionExists('faq') ? (
                    <>
                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSectionToDelete('faq');
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer cette section
                        </Button>
                      </div>
                      <FAQSectionEditor onSave={refreshPreview} />
                    </>
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed rounded-lg space-y-4">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">Cette section a été supprimée</p>
                      <Button
                        onClick={() => handleRecreateSection('faq')}
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Recréer cette section
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {showPreview && (
              <div className="lg:sticky lg:top-6 lg:h-screen lg:overflow-auto">
                <LivePreview key={previewKey} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la section "{sectionToDelete ? getSectionDisplayName(sectionToDelete) : ''}" ? 
              Cette action est irréversible et supprimera tout le contenu de cette section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sectionToDelete && handleDeleteSection(sectionToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
