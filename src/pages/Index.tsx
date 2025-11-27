import ModernHeader from '@/components/ModernHeader';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import Testimonials from '@/components/Testimonials';
import SocialProof from '@/components/SocialProof';
import FAQ from '@/components/FAQ';
import ContactFormDialog from '@/components/ContactFormDialog';
import { ContactMessageForm } from '@/components/ContactMessageForm';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import { useState, useEffect } from 'react';
import { EditModeBar } from '@/components/admin/homepage/EditModeBar';
import { EditableSection } from '@/components/admin/homepage/EditableSection';
import { supabase } from '@/integrations/supabase/client';
import ScrollToTopButton from '@/components/ScrollToTopButton';

const Index = () => {
  const [isInscriptionDialogOpen, setIsInscriptionDialogOpen] = useState(false);
  const [heroSectionId, setHeroSectionId] = useState<string>("");
  const [pricing, setPricing] = useState({
    originalPrice: '',
    discountedPrice: ''
  });
  
  const services = [
    {
      name: "Meta Ads Mastery",
      description: "Formation complète pour maîtriser Facebook & Instagram Ads et vendre sans site web via WhatsApp Business.",
      provider: "Meta Ads Training"
    }
  ];

  useEffect(() => {
    const loadSectionIds = async () => {
      const { data } = await supabase
        .from('landing_page_sections')
        .select('id, section_key')
        .eq('section_key', 'hero')
        .eq('is_active', true)
        .single();
      
      if (data) {
        setHeroSectionId(data.id);
      }
    };

    const loadPricing = async () => {
      const { data } = await supabase
        .from('landing_page_sections')
        .select('content')
        .eq('section_key', 'bonus_pricing')
        .single();
      
      if (data?.content) {
        const content = data.content as any;
        if (content.pricing) {
          setPricing({
            originalPrice: content.pricing.originalPrice || '',
            discountedPrice: content.pricing.discountedPrice || ''
          });
        }
      }
    };

    loadSectionIds();
    loadPricing();
  }, []);

  return (
    <>
      <EditModeBar />
      <div className="min-h-screen">
        <SEO 
          title="Meta Ads Mastery - Formation Facebook & Instagram Ads | Vendre Sans Site Web"
          description="Formation complète en Meta Ads pour entrepreneurs africains. Apprends à créer des publicités Facebook et Instagram rentables et vends directement via WhatsApp Business. Aucun site web requis. Prix promo: $49.99"
          keywords="formation facebook ads, formation instagram ads, meta ads afrique, publicité facebook, whatsapp business, marketing digital afrique, formation publicité en ligne, vendre sans site web"
          url="https://contentfarm.club"
          type="website"
          image="https://contentfarm.club/lovable-uploads/42844e19-815c-453d-9d1d-66e5ec0590fb.png"
        />
        
        <StructuredData type="organization" />
        <StructuredData type="service" services={services} />
        
        <ModernHeader />
        {heroSectionId && (
          <EditableSection 
            sectionId={heroSectionId} 
            sectionKey="hero"
          >
            <Hero />
          </EditableSection>
        )}
      <div id="services">
        <Services />
      </div>
      <Testimonials />
      <SocialProof />
      <FAQ />
      
      <section className="cinematic-section py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Prêt à Maîtriser Meta Ads et Transformer Ton Business ?
          </h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Ne laisse pas passer cette opportunité. Rejoins Meta Ads Mastery maintenant et commence à générer des résultats dès aujourd'hui !
          </p>
          {pricing.originalPrice && pricing.discountedPrice && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl font-bold text-foreground line-through opacity-50">${pricing.originalPrice}</span>
                <span className="text-5xl sm:text-6xl font-bold text-primary">${pricing.discountedPrice}</span>
              </div>
            </div>
          )}
          <p className="text-warning font-semibold text-lg mb-8">
            ⚠️ Offre limitée - Le prix augmente bientôt !
          </p>
          <Button 
            onClick={() => setIsInscriptionDialogOpen(true)}
            size="lg"
            className="cinematic-cta text-lg px-12 py-6"
          >
            Je Rejoins la Formation
          </Button>
          <ContactFormDialog isOpen={isInscriptionDialogOpen} onOpenChange={setIsInscriptionDialogOpen} />
        </div>
      </section>
      
      <section id="contact-form" className="cinematic-section py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Une Question ? Contactez-nous
            </h2>
            <p className="text-gray-300">
              Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.
            </p>
          </div>
          
          <div className="cinematic-card p-8">
            <ContactMessageForm />
          </div>
        </div>
      </section>
      
        <footer className="cinematic-section py-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-300 text-sm">© 2025 Meta Ads Mastery. Tous droits réservés.</p>
          </div>
        </footer>
        <ScrollToTopButton />
      </div>
    </>
  );
};

export default Index;
