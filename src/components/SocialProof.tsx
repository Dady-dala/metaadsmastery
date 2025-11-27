import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface SocialProofImage {
  url: string;
  caption?: string;
  order: number;
}

const SocialProof = () => {
  const [images, setImages] = useState<SocialProofImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const { data: sectionData } = await supabase
        .from('landing_page_sections')
        .select('content')
        .eq('section_key', 'social-proof')
        .eq('is_active', true)
        .maybeSingle();

      if (sectionData?.content) {
        const content = sectionData.content as any;
        setImages(content.proofs || content.images || []);
      }
    } catch (error) {
      console.error('Erreur chargement preuves sociales:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <section className="cinematic-section py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ils Ont Réussi Avec Meta Ads Mastery
          </h2>
          <p className="text-xl text-muted-foreground">
            Découvre les résultats concrets de nos étudiants
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images
            .sort((a, b) => a.order - b.order)
            .map((image, index) => (
              <div
                key={index}
                className="cinematic-card overflow-hidden group hover:scale-105 transition-transform duration-300"
              >
                <div className="aspect-square relative">
                  <img
                    src={image.url}
                    alt={image.caption || `Preuve sociale ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                {image.caption && (
                  <div className="p-4 bg-card/50 backdrop-blur-sm">
                    <p className="text-sm text-foreground text-center">
                      {image.caption}
                    </p>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
