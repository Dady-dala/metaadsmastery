import { Play, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import ScrollingBrands from '@/components/ScrollingBrands';
import ContactFormDialog from '@/components/ContactFormDialog';
import { supabase } from '@/integrations/supabase/client';

const Hero = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [heroData, setHeroData] = useState({
    title: '',
    subtitle1: '',
    subtitle2: '',
    wistiaMediaId: '',
    ctaText: '',
    logosTitle: ''
  });

  useEffect(() => {
    loadHeroData();
  }, []);

  const loadHeroData = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('*')
        .eq('section_key', 'hero')
        .eq('is_active', true)
        .single();

      if (data && !error) {
        const content = data.content as any || {};
        
        setHeroData({
          title: data.title || '',
          subtitle1: data.subtitle || '',
          subtitle2: content.subtitle2 || '',
          wistiaMediaId: data.media_url || '',
          ctaText: content.ctaText || '',
          logosTitle: content.logosTitle || ''
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la section Hero:', error);
    }
  };

  useEffect(() => {
    // Add Wistia scripts to head
    const script1 = document.createElement('script');
    script1.src = 'https://fast.wistia.com/player.js';
    script1.async = true;
    document.head.appendChild(script1);
    const script2 = document.createElement('script');
    script2.src = `https://fast.wistia.com/embed/${heroData.wistiaMediaId}.js`;
    script2.async = true;
    script2.type = 'module';
    document.head.appendChild(script2);

    // Add Wistia styles to head
    const style = document.createElement('style');
    style.textContent = `
      wistia-player[media-id='${heroData.wistiaMediaId}']:not(:defined) { 
        background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/${heroData.wistiaMediaId}/swatch'); 
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
  }, [heroData.wistiaMediaId]);
  return <section className="relative pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 overflow-hidden cinematic-section" style={{
    contain: 'layout'
  }}>
      {/* Film grain effect */}
      <div className="absolute inset-0 cinematic-grain opacity-20 z-0" style={{
      willChange: 'opacity'
    }}></div>
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        {/* Title */}
        {heroData.title && (
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold max-w-4xl mx-auto px-2 text-primary" style={{
            textWrap: 'balance',
            lineHeight: '1.15',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.8), 0 0 30px rgba(88, 214, 141, 0.5)'
          }}>
              <span dangerouslySetInnerHTML={{ __html: heroData.title }} />
            </h1>
          </div>
        )}

        {/* Subtitle 1 */}
        {heroData.subtitle1 && (
          <div className="text-center mb-4 sm:mb-6">
            <div className="text-lg sm:text-xl md:text-2xl text-gray-200 font-medium max-w-3xl mx-auto cinematic-text-shadow px-4" style={{
            lineHeight: '1.45'
          }} dangerouslySetInnerHTML={{ __html: heroData.subtitle1 }} />
          </div>
        )}

        {/* Subtitle 2 */}
        {heroData.subtitle2 && (
          <div className="text-center mb-8 sm:mb-12">
            <div className="text-sm sm:text-base md:text-lg text-gray-300 font-normal max-w-3xl mx-auto cinematic-text-shadow px-4" style={{
            lineHeight: '1.5'
          }} dangerouslySetInnerHTML={{ __html: heroData.subtitle2 }} />
          </div>
        )}

        {/* CTA Button */}
        {heroData.ctaText && (
          <div className="flex justify-center mb-12 sm:mb-16 px-4">
            <Button size="lg" className="cinematic-cta text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 font-semibold shadow-2xl hover:shadow-glow transition-all duration-500 transform hover:scale-105 w-full sm:w-auto" onClick={() => setIsDialogOpen(true)}>
              {heroData.ctaText}
            </Button>
          </div>
        )}

        {/* Form Dialog */}
        <ContactFormDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />

        {/* Wistia Video Player */}
        {heroData.wistiaMediaId && (
          <div className="relative max-w-4xl mx-auto mb-12 sm:mb-16 md:mb-20 px-4" style={{
          contain: 'layout'
        }}>
            <div className="relative cinematic-video-container overflow-hidden shadow-cinematic border border-white/10 rounded-lg" style={{
            aspectRatio: '16/9',
            willChange: 'transform'
          }}>
              <wistia-player media-id={heroData.wistiaMediaId} seo={false} aspect={1.7777777777777777}></wistia-player>
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
        )}

        {/* Logos Carousel */}
        {heroData.logosTitle && (
          <div className="relative px-4" style={{
          contain: 'layout'
        }}>
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white cinematic-text-shadow">{heroData.logosTitle}</h2>
            </div>
            <ScrollingBrands />
          </div>
        )}
      </div>
    </section>;
};
export default Hero;