import { Play, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import ScrollingBrands from '@/components/ScrollingBrands';
import ContactFormDialog from '@/components/ContactFormDialog';
const Hero = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  useEffect(() => {
    // Add Wistia scripts to head
    const script1 = document.createElement('script');
    script1.src = 'https://fast.wistia.com/player.js';
    script1.async = true;
    document.head.appendChild(script1);
    const script2 = document.createElement('script');
    script2.src = 'https://fast.wistia.com/embed/wfrtok35jw.js';
    script2.async = true;
    script2.type = 'module';
    document.head.appendChild(script2);

    // Add Wistia styles to head
    const style = document.createElement('style');
    style.textContent = `
      wistia-player[media-id='wfrtok35jw']:not(:defined) { 
        background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/wfrtok35jw/swatch'); 
        display: block; 
        filter: blur(5px); 
        padding-top:56.25%; 
      }
    `;
    document.head.appendChild(style);

    // Cleanup function
    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
      document.head.removeChild(style);
    };
  }, []);
  return <section className="relative pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 overflow-hidden cinematic-section" style={{
    contain: 'layout'
  }}>
      {/* Film grain effect */}
      <div className="absolute inset-0 cinematic-grain opacity-20 z-0" style={{
      willChange: 'opacity'
    }}></div>
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        {/* Title */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white max-w-4xl mx-auto px-2" style={{
          textWrap: 'balance',
          lineHeight: '1.15'
        }}>
            <span className="cinematic-gradient-text cinematic-text-shadow text-gray-50">Maîtrise Facebook & Instagram Ads et Transforme Ton Business en Machine à Ventes Automatique</span>
          </h1>
        </div>

        {/* Subtitle 1 */}
        <div className="text-center mb-4 sm:mb-6">
          <p className="text-lg sm:text-xl md:text-2xl text-gray-200 font-medium max-w-3xl mx-auto cinematic-text-shadow px-4" style={{
          lineHeight: '1.45'
        }}>La Formation Complète pour Vendre SANS Site Web grâce à Facebook, Instagram & WhatsApp Business — Même si tu Pars de Zéro.</p>
        </div>

        {/* Subtitle 2 */}
        <div className="text-center mb-8 sm:mb-12">
          <p className="text-sm sm:text-base md:text-lg text-gray-300 font-normal max-w-3xl mx-auto cinematic-text-shadow px-4" style={{
          lineHeight: '1.5'
        }}>
            <span className="font-semibold text-yellow-400">Garantie Satisfaction 30 Jours :</span> Si la formation ne correspond pas à tes attentes, tu es remboursé intégralement — sans question, sans condition.
          </p>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center mb-12 sm:mb-16 px-4">
          <Button size="lg" className="cinematic-cta text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 font-semibold shadow-2xl hover:shadow-glow transition-all duration-500 transform hover:scale-105 w-full sm:w-auto" onClick={() => setIsDialogOpen(true)}>
            Je Veux Accéder à la Formation →
          </Button>
        </div>

        {/* Form Dialog */}
        <ContactFormDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />

        {/* Wistia Video Player */}
        <div className="relative max-w-4xl mx-auto mb-12 sm:mb-16 md:mb-20 px-4" style={{
        contain: 'layout'
      }}>
          <div className="relative cinematic-video-container overflow-hidden shadow-cinematic border border-white/10 rounded-lg" style={{
          aspectRatio: '16/9',
          willChange: 'transform'
        }}>
            <wistia-player media-id="wfrtok35jw" seo={false} aspect={1.7777777777777777}></wistia-player>
          </div>
          
          {/* Cinematic light flares */}
          <div className="absolute -bottom-6 -left-6 w-24 h-24 sm:w-32 sm:h-32 bg-yellow-400/20 rounded-full blur-3xl cinematic-flare" style={{
          willChange: 'transform, opacity'
        }}></div>
          <div className="absolute -top-6 -right-6 w-24 h-24 sm:w-32 sm:h-32 bg-yellow-400/15 rounded-full blur-3xl cinematic-flare" style={{
          animationDelay: '1s',
          willChange: 'transform, opacity'
        }}></div>
        </div>

        {/* Logos Carousel */}
        <div className="relative px-4" style={{
        contain: 'layout'
      }}>
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white cinematic-text-shadow">Ils Nous Font Confiance</h2>
          </div>
          <ScrollingBrands />
        </div>
      </div>
    </section>;
};
export default Hero;