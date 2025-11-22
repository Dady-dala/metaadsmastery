import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ModernHeader from '@/components/ModernHeader';
import ContactFormDialog from '@/components/ContactFormDialog';
import SEO from '@/components/SEO';
import { WidgetRenderer } from '@/components/landing/WidgetRenderer';

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

const DynamicPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isInscriptionDialogOpen, setIsInscriptionDialogOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPageAndSections();
    }
  }, [slug]);

  const fetchPageAndSections = async () => {
    try {
      setLoading(true);
      setNotFound(false);

      // Fetch page
      const { data: pageData, error: pageError } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', `/${slug}`)
        .eq('is_active', true)
        .maybeSingle();

      if (pageError) throw pageError;
      
      if (!pageData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setPage(pageData);

      // Fetch sections for this page
      const sectionKeyPattern = `${slug}_%`;
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('landing_page_sections')
        .select('*')
        .like('section_key', sectionKeyPattern)
        .eq('is_active', true)
        .order('order_index');

      if (sectionsError) throw sectionsError;
      setSections(sectionsData || []);
    } catch (error) {
      console.error('Error fetching page:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (notFound || !page) {
    return <Navigate to="/404" replace />;
  }

  return (
    <>
      <SEO
        title={page.title}
        description={page.meta_description || undefined}
      />

      <div className="min-h-screen">
        <ModernHeader />
        
        {sections.length === 0 ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">{page.title}</h1>
              <p className="text-muted-foreground">Aucune section disponible pour cette page.</p>
            </div>
          </div>
        ) : (
          sections.map(section => (
            <WidgetRenderer
              key={section.id}
              section={section}
              onCtaClick={() => setIsInscriptionDialogOpen(true)}
            />
          ))
        )}

        <ContactFormDialog 
          isOpen={isInscriptionDialogOpen} 
          onOpenChange={setIsInscriptionDialogOpen} 
        />

        <footer className="bg-background border-t py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Meta Ads Mastery. Tous droits réservés.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default DynamicPage;
