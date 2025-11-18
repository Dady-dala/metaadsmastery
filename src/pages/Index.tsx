import ModernHeader from '@/components/ModernHeader';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import Testimonials from '@/components/Testimonials';
import FAQ from '@/components/FAQ';
import ContactFormDialog from '@/components/ContactFormDialog';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';

const Index = () => {
  const services = [
    {
      name: "Meta Ads Mastery",
      description: "Formation complète pour maîtriser Facebook & Instagram Ads et vendre sans site web via WhatsApp Business.",
      provider: "Meta Ads Training"
    }
  ];

  return (
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
      <Hero />
      <div id="services">
        <Services />
      </div>
      <Testimonials />
      <FAQ />
      
      <section className="cinematic-section py-16 px-4 sm:px-6 lg:px-8">
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
            <ContactFormDialog isOpen={false} onOpenChange={() => {}} inlineForm />
          </div>
        </div>
      </section>
      
      <footer className="cinematic-section py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-300 text-sm">© 2025 Meta Ads Mastery. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
