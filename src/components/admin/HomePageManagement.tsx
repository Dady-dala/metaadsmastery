import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Video, Loader2 } from 'lucide-react';

interface HeroSettings {
  title: string;
  subtitle1: string;
  subtitle2: string;
  guarantee: string;
  wistiaMediaId: string;
  ctaText: string;
  logosTitle: string;
}

export const HomePageManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<HeroSettings>({
    title: '',
    subtitle1: '',
    subtitle2: '',
    guarantee: '',
    wistiaMediaId: '',
    ctaText: '',
    logosTitle: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('*')
        .eq('section_key', 'hero')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const content = data.content as any || {};
        setSettings({
          title: data.title || '',
          subtitle1: data.subtitle || '',
          subtitle2: content.subtitle2 || '',
          guarantee: content.guarantee || '',
          wistiaMediaId: data.media_url || '',
          ctaText: content.ctaText || '',
          logosTitle: content.logosTitle || ''
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('landing_page_sections')
        .select('id')
        .eq('section_key', 'hero')
        .single();

      const payload = {
        section_key: 'hero',
        section_type: 'hero',
        title: settings.title,
        subtitle: settings.subtitle1,
        media_url: settings.wistiaMediaId,
        content: {
          subtitle2: settings.subtitle2,
          guarantee: settings.guarantee,
          ctaText: settings.ctaText,
          logosTitle: settings.logosTitle
        },
        is_active: true,
        order_index: 0
      };

      let error;
      if (existing) {
        ({ error } = await supabase
          .from('landing_page_sections')
          .update(payload)
          .eq('id', existing.id));
      } else {
        ({ error } = await supabase
          .from('landing_page_sections')
          .insert(payload));
      }

      if (error) throw error;

      toast.success('Paramètres enregistrés avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Video className="w-5 h-5" />
            Gestion de la Page d'Accueil
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Modifiez le contenu de votre page d'accueil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Titre Principal */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground">Titre Principal</Label>
            <Textarea
              id="title"
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              placeholder="Maîtrise Facebook & Instagram Ads..."
              className="min-h-[100px] bg-background border-border text-foreground"
            />
          </div>

          {/* Sous-titre 1 */}
          <div className="space-y-2">
            <Label htmlFor="subtitle1" className="text-foreground">Sous-titre 1</Label>
            <Textarea
              id="subtitle1"
              value={settings.subtitle1}
              onChange={(e) => setSettings({ ...settings, subtitle1: e.target.value })}
              placeholder="La Formation Complète pour Vendre..."
              className="min-h-[80px] bg-background border-border text-foreground"
            />
          </div>

          {/* Sous-titre 2 (Garantie) */}
          <div className="space-y-2">
            <Label htmlFor="subtitle2" className="text-foreground">Sous-titre 2</Label>
            <Textarea
              id="subtitle2"
              value={settings.subtitle2}
              onChange={(e) => setSettings({ ...settings, subtitle2: e.target.value })}
              placeholder="Garantie Satisfaction 30 Jours..."
              className="min-h-[80px] bg-background border-border text-foreground"
            />
          </div>

          {/* Vidéo Wistia */}
          <div className="space-y-2">
            <Label htmlFor="wistiaMediaId" className="text-foreground flex items-center gap-2">
              <Video className="w-4 h-4" />
              ID de la Vidéo Wistia
            </Label>
            <Input
              id="wistiaMediaId"
              value={settings.wistiaMediaId}
              onChange={(e) => setSettings({ ...settings, wistiaMediaId: e.target.value })}
              placeholder="wfrtok35jw"
              className="bg-background border-border text-foreground"
            />
            <p className="text-sm text-muted-foreground">
              Entrez l'ID de votre vidéo Wistia (ex: wfrtok35jw)
            </p>
          </div>

          {/* Texte du CTA */}
          <div className="space-y-2">
            <Label htmlFor="ctaText" className="text-foreground">Texte du Bouton CTA</Label>
            <Input
              id="ctaText"
              value={settings.ctaText}
              onChange={(e) => setSettings({ ...settings, ctaText: e.target.value })}
              placeholder="Je Veux Accéder à la Formation →"
              className="bg-background border-border text-foreground"
            />
          </div>

          {/* Titre des Logos */}
          <div className="space-y-2">
            <Label htmlFor="logosTitle" className="text-foreground">Titre de la Section Logos</Label>
            <Input
              id="logosTitle"
              value={settings.logosTitle}
              onChange={(e) => setSettings({ ...settings, logosTitle: e.target.value })}
              placeholder="Ils Nous Font Confiance"
              className="bg-background border-border text-foreground"
            />
          </div>

          {/* Bouton Enregistrer */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full md:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer les Modifications
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
