import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, TrendingUp, Users, Star, Award } from 'lucide-react';
import { useState } from 'react';

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

  switch (section.section_type) {
    case 'hero':
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