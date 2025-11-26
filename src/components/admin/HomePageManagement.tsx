import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff } from 'lucide-react';
import { HeroSectionEditor } from './homepage/HeroSectionEditor';
import { ServicesSectionEditor } from './homepage/ServicesSectionEditor';
import { TestimonialsSectionEditor } from './homepage/TestimonialsSectionEditor';
import { FAQSectionEditor } from './homepage/FAQSectionEditor';
import { LivePreview } from './homepage/LivePreview';

export const HomePageManagement = () => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const refreshPreview = () => {
    setPreviewKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Gestion de la Page d'Accueil</CardTitle>
              <CardDescription className="text-muted-foreground">
                Modifiez le contenu de toutes les sections de votre page d'accueil
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Masquer l\'aperçu' : 'Afficher l\'aperçu'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Tabs defaultValue="hero" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-muted">
                  <TabsTrigger value="hero">Hero</TabsTrigger>
                  <TabsTrigger value="services">Services</TabsTrigger>
                  <TabsTrigger value="testimonials">Témoignages</TabsTrigger>
                  <TabsTrigger value="faq">FAQ</TabsTrigger>
                </TabsList>
                
                <TabsContent value="hero" className="mt-6">
                  <HeroSectionEditor onSave={refreshPreview} />
                </TabsContent>
                
                <TabsContent value="services" className="mt-6">
                  <ServicesSectionEditor onSave={refreshPreview} />
                </TabsContent>
                
                <TabsContent value="testimonials" className="mt-6">
                  <TestimonialsSectionEditor onSave={refreshPreview} />
                </TabsContent>
                
                <TabsContent value="faq" className="mt-6">
                  <FAQSectionEditor onSave={refreshPreview} />
                </TabsContent>
              </Tabs>
            </div>

            {showPreview && (
              <div className="lg:sticky lg:top-6 lg:h-screen lg:overflow-auto">
                <LivePreview key={previewKey} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
