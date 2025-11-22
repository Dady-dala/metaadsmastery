import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ModernHeader from '@/components/ModernHeader';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import Testimonials from '@/components/Testimonials';
import FAQ from '@/components/FAQ';
import ContactFormDialog from '@/components/ContactFormDialog';
import { ContactMessageForm } from '@/components/ContactMessageForm';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';

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

const DynamicIndex = () => {
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInscriptionDialogOpen, setIsInscriptionDialogOpen] = useState(false);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('*')
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

  const renderSection = (section: LandingSection) => {
    const sectionClasses = section.styles?.background || 'bg-background';
    const textColor = section.styles?.text_color || 'text-foreground';

    switch (section.section_type) {
      case 'hero':
        return <Hero key={section.id} />;

      case 'services':
        return <Services key={section.id} />;

      case 'testimonials':
        return <Testimonials key={section.id} />;

      case 'faq':
        return <FAQ key={section.id} />;

      case 'cta':
        return (
          <section key={section.id} className={`py-20 ${sectionClasses}`}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${textColor}`}>
                {section.title}
              </h2>
              {section.subtitle && (
                <p className={`text-xl mb-8 ${textColor} opacity-90`}>
                  {section.subtitle}
                </p>
              )}
              {section.content?.price_original && (
                <div className="flex items-center justify-center gap-4 mb-8">
                  <span className="text-2xl text-muted-foreground line-through">
                    ${section.content.price_original}
                  </span>
                  <span className="text-5xl font-bold text-primary">
                    ${section.content.price_promo}
                  </span>
                </div>
              )}
              <Button
                size="lg"
                onClick={() => setIsInscriptionDialogOpen(true)}
                className="cinematic-cta text-lg px-10 py-6"
              >
                {section.content?.cta_text || "Je M'Inscris Maintenant"}
              </Button>
            </div>
          </section>
        );

      case 'contact':
        return (
          <section key={section.id} className={`py-20 ${sectionClasses}`}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              {section.title && (
                <h2 className={`text-3xl md:text-4xl font-bold mb-4 text-center ${textColor}`}>
                  {section.title}
                </h2>
              )}
              {section.subtitle && (
                <p className={`text-xl mb-8 text-center ${textColor} opacity-90`}>
                  {section.subtitle}
                </p>
              )}
              <ContactMessageForm />
            </div>
          </section>
        );

      case 'text':
        return (
          <section key={section.id} className={`py-20 ${sectionClasses}`}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              {section.title && (
                <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${textColor}`}>
                  {section.title}
                </h2>
              )}
              {section.subtitle && (
                <p className={`text-xl ${textColor} opacity-90`}>
                  {section.subtitle}
                </p>
              )}
            </div>
          </section>
        );

      case 'video':
        return (
          <section key={section.id} className={`py-20 ${sectionClasses}`}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              {section.title && (
                <h2 className={`text-3xl md:text-4xl font-bold mb-6 text-center ${textColor}`}>
                  {section.title}
                </h2>
              )}
              {section.media_url && (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={section.media_url}
                    className="w-full h-full"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Meta Ads Mastery - Formation Complète Meta Ads A à Z"
        description="Apprenez à maîtriser les publicités Meta (Facebook & Instagram) de A à Z. Formation complète pour entrepreneurs africains avec résultats garantis."
        keywords="meta ads, formation facebook ads, publicité instagram, entrepreneur africain, formation marketing digital"
      />
      
      <StructuredData
        type="organization"
        data={{
          name: "Meta Ads Mastery",
          description: "Formation complète pour maîtriser les Meta Ads"
        }}
      />

      <div className="min-h-screen">
        <ModernHeader />
        
        {sections.map(section => renderSection(section))}

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

export default DynamicIndex;