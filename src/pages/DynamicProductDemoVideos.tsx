import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ModernHeader from '@/components/ModernHeader';
import Footer from '@/components/Footer';
import { WidgetRenderer } from '@/components/landing/WidgetRenderer';
import SEO from '@/components/SEO';

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

const DynamicProductDemoVideos = () => {
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('*')
        .like('section_key', 'product_demo_%')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cinematic-section flex items-center justify-center">
        <div className="text-white text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cinematic-section">
      <SEO 
        title="Product Demo Videos - Case Studies"
        description="Watch how we transformed these businesses with our video strategies. Real results from real companies."
      />
      <ModernHeader />
      
      <main className="pt-24">
        {sections.map((section) => (
          <WidgetRenderer key={section.id} section={section} />
        ))}
      </main>

      <Footer />
    </div>
  );
};

export default DynamicProductDemoVideos;
