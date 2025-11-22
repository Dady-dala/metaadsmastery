import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Check, TrendingUp, Users, Star, Award, Play, Zap, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LandingSection {
  id: string;
  section_type: string;
  title: string | null;
  subtitle: string | null;
  content: any;
  styles: any;
  media_url: string | null;
}

interface WidgetRendererProps {
  section: LandingSection;
  onCtaClick?: () => void;
}

export const WidgetRenderer = ({ section, onCtaClick }: WidgetRendererProps) => {
  const sectionClasses = section.styles?.background || 'bg-background';
  const textColor = section.styles?.text_color || 'text-foreground';

  // Load Wistia scripts for video sections
  useEffect(() => {
    if (section.section_type === 'video') {
      const script1 = document.createElement('script');
      script1.src = 'https://fast.wistia.com/player.js';
      script1.async = true;
      document.head.appendChild(script1);

      return () => {
        if (document.head.contains(script1)) {
          document.head.removeChild(script1);
        }
      };
    }
  }, [section.section_type]);

  switch (section.section_type) {
    case 'hero':
      // Check if this is product demo hero
      if (section.content?.stats) {
        return (
          <section className={`py-20 relative overflow-hidden ${sectionClasses}`}>
            <div className="absolute inset-0 cinematic-grain opacity-20"></div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4 mb-12">
                <a href="/" className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </a>
              </div>
              
              <div className="text-center">
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight cinematic-text-shadow">
                  {section.title?.split('These Businesses')[0]}
                  <span className="cinematic-gradient-text">
                    {section.title?.includes('These Businesses') ? ' These Businesses' : ''}
                  </span>
                </h1>
                
                {section.subtitle && (
                  <p className="text-xl text-gray-200 max-w-4xl mx-auto mb-8">
                    {section.subtitle}
                  </p>
                )}
                
                {section.content.stats && (
                  <div className="flex items-center justify-center gap-8 text-sm text-gray-300 mb-12">
                    {section.content.stats.map((stat: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        {stat.icon === 'TrendingUp' && <TrendingUp className="h-4 w-4 text-yellow-400" />}
                        {stat.icon === 'Zap' && <Zap className="h-4 w-4 text-yellow-400" />}
                        <span>{stat.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      }
      
      // Default hero
      return (
        <section className={`py-20 ${sectionClasses}`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className={`text-4xl md:text-6xl font-bold mb-6 ${textColor}`}>
              {section.title}
            </h1>
            {section.subtitle && (
              <p className={`text-xl md:text-2xl mb-8 ${textColor} opacity-90`}>
                {section.subtitle}
              </p>
            )}
            {section.content?.cta_text && (
              <Button size="lg" onClick={onCtaClick} className="cinematic-cta text-lg px-10 py-6">
                {section.content.cta_text}
              </Button>
            )}
          </div>
        </section>
      );

    case 'carousel':
      return <CarouselWidget section={section} textColor={textColor} />;

    case 'stats_counter':
      return <StatsCounterWidget section={section} textColor={textColor} />;

    case 'benefits':
      return <BenefitsWidget section={section} textColor={textColor} />;

    case 'cta':
      // Check if this is product demo CTA
      if (section.content?.button_url) {
        return (
          <section className="py-20 cinematic-section">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className={`text-center p-8 relative overflow-hidden ${sectionClasses}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-yellow-500/10"></div>
                <div className="relative">
                  {section.title && (
                    <h2 className="text-3xl font-bold mb-4 cinematic-gradient-text">
                      {section.title}
                    </h2>
                  )}
                  {section.subtitle && (
                    <p className="text-xl mb-6 text-gray-200">{section.subtitle}</p>
                  )}
                  <a 
                    href={section.content.button_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-block cinematic-cta font-bold text-lg px-8 py-4 transform hover:scale-105"
                  >
                    {section.content.button_text}
                  </a>
                  {section.content?.footer_text && (
                    <p className="text-sm mt-4 text-gray-300">
                      {section.content.footer_text}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      }
      
      // Default CTA
      return (
        <section className={`py-20 ${sectionClasses}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${textColor}`}>
              {section.title}
            </h2>
            {section.subtitle && (
              <p className={`text-xl mb-8 ${textColor} opacity-90`}>{section.subtitle}</p>
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
            <Button size="lg" onClick={onCtaClick} className="cinematic-cta text-lg px-10 py-6">
              {section.content?.cta_text || "Commencer Maintenant"}
            </Button>
          </div>
        </section>
      );

    case 'text':
      return (
        <section className={`py-20 ${sectionClasses}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {section.title && (
              <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${textColor}`}>
                {section.title}
              </h2>
            )}
            {section.subtitle && (
              <p className={`text-xl ${textColor} opacity-90`}>{section.subtitle}</p>
            )}
          </div>
        </section>
      );

    case 'video':
      // Check if this is product demo videos grid
      if (section.content?.videos) {
        return (
          <section className="py-20 cinematic-section relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {section.title && (
                <h2 className="text-3xl font-bold mb-4 text-center text-white">{section.title}</h2>
              )}
              {section.subtitle && (
                <p className="text-center text-gray-200 mb-12">{section.subtitle}</p>
              )}
              
              <div className={`grid ${section.styles?.columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-8 max-w-6xl mx-auto`}>
                {section.content.videos.map((video: any) => (
                  <Dialog key={video.id}>
                    <DialogTrigger asChild>
                      <div className="group cursor-pointer">
                        <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
                          <div className={`absolute inset-0 ${video.thumbnail} transition-transform duration-500 group-hover:scale-110`}>
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300"></div>
                            
                            <div className="absolute inset-0 flex items-center justify-center">
                              {video.wistia_id ? (
                                <wistia-player 
                                  media-id={video.wistia_id} 
                                  aspect={1.7777777777777777} 
                                  seo={false}
                                ></wistia-player>
                              ) : (
                                <div className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-125 group-hover:bg-white transition-all duration-300 shadow-lg">
                                  <Play className="h-10 w-10 text-gray-900 ml-1" fill="currentColor" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogTrigger>
                    
                    <DialogContent className="max-w-4xl w-full p-0 cinematic-section border-white/20">
                      <div className="aspect-video">
                        <wistia-player 
                          media-id={video.wistia_id} 
                          aspect={1.7777777777777777} 
                          seo={false}
                        ></wistia-player>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          </section>
        );
      }
      
      // Default single video
      return (
        <section className={`py-20 ${sectionClasses}`}>
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

const CarouselWidget = ({ section, textColor }: { section: LandingSection; textColor: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = section.content?.images || [];

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  if (images.length === 0) return null;

  return (
    <section className={`py-20 ${section.styles?.background || 'bg-background'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {section.title && (
          <h2 className={`text-3xl md:text-4xl font-bold mb-8 text-center ${textColor}`}>
            {section.title}
          </h2>
        )}
        <div className="relative">
          <div className="aspect-video rounded-lg overflow-hidden">
            <img
              src={images[currentIndex].url}
              alt={images[currentIndex].alt || `Slide ${currentIndex + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2"
            onClick={prevSlide}
          >
            ←
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2"
            onClick={nextSlide}
          >
            →
          </Button>
          <div className="flex justify-center gap-2 mt-4">
            {images.map((_: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const StatsCounterWidget = ({ section, textColor }: { section: LandingSection; textColor: string }) => {
  const stats = section.content?.stats || [];

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      users: Users,
      trending: TrendingUp,
      star: Star,
      award: Award,
    };
    return icons[iconName] || Users;
  };

  return (
    <section className={`py-20 ${section.styles?.background || 'bg-background'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {section.title && (
          <h2 className={`text-3xl md:text-4xl font-bold mb-12 text-center ${textColor}`}>
            {section.title}
          </h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat: any, idx: number) => {
            const Icon = getIcon(stat.icon);
            return (
              <Card key={idx} className="text-center">
                <CardContent className="pt-6">
                  <Icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <p className="text-4xl font-bold mb-2">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const BenefitsWidget = ({ section, textColor }: { section: LandingSection; textColor: string }) => {
  const benefits = section.content?.benefits || [];

  return (
    <section className={`py-20 ${section.styles?.background || 'bg-background'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {section.title && (
          <h2 className={`text-3xl md:text-4xl font-bold mb-12 text-center ${textColor}`}>
            {section.title}
          </h2>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit: any, idx: number) => (
            <Card key={idx} className="border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};