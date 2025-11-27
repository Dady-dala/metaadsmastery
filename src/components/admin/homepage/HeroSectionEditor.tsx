import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Loader2, Video } from 'lucide-react';
import RichTextEditor from '@/components/admin/RichTextEditor';

interface HeroSettings {
  title: string;
  subtitle1: string;
  subtitle2: string;
  wistiaMediaId: string;
  ctaText: string;
  logosTitle: string;
}

interface Props {
  onSave?: () => void;
}

export const HeroSectionEditor = ({ onSave }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewWistiaId, setPreviewWistiaId] = useState('');
  const [settings, setSettings] = useState<HeroSettings>({
    title: '',
    subtitle1: '',
    subtitle2: '',
    wistiaMediaId: '',
    ctaText: '',
    logosTitle: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  // Load Wistia scripts for preview
  useEffect(() => {
    const script1 = document.createElement('script');
    script1.src = 'https://fast.wistia.com/assets/external/E-v1.js';
    script1.async = true;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = 'https://fast.wistia.com/embed/medias.jsonp';
    script2.async = true;
    document.head.appendChild(script2);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
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
        const mediaUrl = data.media_url || '';
        
        setSettings({
          title: data.title || '',
          subtitle1: data.subtitle || '',
          subtitle2: content.subtitle2 || '',
          wistiaMediaId: mediaUrl,
          ctaText: content.ctaText || '',
          logosTitle: content.logosTitle || ''
        });

        // Extract and set preview ID from loaded data
        if (mediaUrl) {
          const extracted = extractWistiaId(mediaUrl);
          if (extracted && /^[a-z0-9]+$/i.test(extracted)) {
            setPreviewWistiaId(extracted);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  // Extract Wistia media ID from various formats
  const extractWistiaId = (input: string): string => {
    // Remove whitespace
    const trimmed = input.trim();
    
    // Format 1: Direct ID (e.g., "jdj0b36zz9")
    if (/^[a-z0-9]+$/i.test(trimmed)) {
      return trimmed;
    }
    
    // Format 2: URL (e.g., "https://dadykakwata.wistia.com/medias/jdj0b36zz9?embedType=web_component&seo=false&videoWidth=960")
    const urlMatch = trimmed.match(/wistia\.com\/medias\/([a-z0-9]+)/i);
    if (urlMatch) {
      return urlMatch[1];
    }
    
    // Format 3: Web component code (e.g., '<wistia-player media-id="jdj0b36zz9"...')
    const componentMatch = trimmed.match(/media-id=["']([a-z0-9]+)["']/i);
    if (componentMatch) {
      return componentMatch[1];
    }
    
    // If no pattern matches, return as-is and let validation handle it
    return trimmed;
  };

  // Handle Wistia ID input change with live preview
  const handleWistiaIdChange = (value: string) => {
    setSettings({ ...settings, wistiaMediaId: value });
    
    // Extract and set preview ID
    const extracted = extractWistiaId(value);
    if (extracted && /^[a-z0-9]+$/i.test(extracted)) {
      setPreviewWistiaId(extracted);
    } else {
      setPreviewWistiaId('');
    }
  };

  const isEmptyHtml = (html: string): boolean => {
    if (!html || html.trim() === '') return true;
    const stripped = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
    return stripped === '';
  };

  const handleSave = async () => {
    // Validation: s'assurer que le titre n'est pas vide
    if (isEmptyHtml(settings.title)) {
      toast.error('Le titre principal ne peut pas être vide');
      return;
    }

    setSaving(true);
    try {
      // Vérifier et rafraîchir la session si nécessaire
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        window.location.href = '/auth';
        return;
      }

      // Rafraîchir le token si proche de l'expiration
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      if (expiresAt && (expiresAt - now) < 300) { // Moins de 5 minutes restantes
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          toast.error('Erreur de rafraîchissement. Veuillez vous reconnecter.');
          window.location.href = '/auth';
          return;
        }
      }

      const { data: existing } = await supabase
        .from('landing_page_sections')
        .select('id')
        .eq('section_key', 'hero')
        .single();

      // Extract Wistia ID before saving
      const extractedId = extractWistiaId(settings.wistiaMediaId);
      
      const payload = {
        section_key: 'hero',
        section_type: 'hero',
        title: settings.title,
        subtitle: settings.subtitle1,
        media_url: extractedId, // Save only the ID
        content: {
          subtitle2: settings.subtitle2,
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

      if (error) {
        // Gestion spécifique de l'erreur JWT expiré
        if (error.code === 'PGRST303') {
          toast.error('Session expirée. Veuillez vous reconnecter.');
          setTimeout(() => {
            window.location.href = '/auth';
          }, 2000);
          return;
        }
        throw error;
      }

      toast.success('Section Hero enregistrée');
      onSave?.();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      
      // Gestion spécifique des erreurs d'authentification
      if (error?.code === 'PGRST303' || error?.message?.includes('JWT')) {
        toast.error('Session expirée. Redirection vers la connexion...');
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
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
      <div className="space-y-2">
        <Label htmlFor="title" className="text-foreground">Titre Principal</Label>
        <RichTextEditor
          value={settings.title}
          onChange={(value) => setSettings({ ...settings, title: value })}
          placeholder="Maîtrise Facebook & Instagram Ads..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitle1" className="text-foreground">Sous-titre 1</Label>
        <RichTextEditor
          value={settings.subtitle1}
          onChange={(value) => setSettings({ ...settings, subtitle1: value })}
          placeholder="La Formation Complète pour Vendre..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitle2" className="text-foreground">Sous-titre 2 (Garantie)</Label>
        <RichTextEditor
          value={settings.subtitle2}
          onChange={(value) => setSettings({ ...settings, subtitle2: value })}
          placeholder="Garantie Satisfaction 30 Jours..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="wistiaMediaId" className="text-foreground flex items-center gap-2">
          <Video className="w-4 h-4" />
          ID ou Lien de la Vidéo Wistia
        </Label>
        <Input
          id="wistiaMediaId"
          value={settings.wistiaMediaId}
          onChange={(e) => handleWistiaIdChange(e.target.value)}
          placeholder="jdj0b36zz9 ou https://dadykakwata.wistia.com/medias/jdj0b36zz9"
          className="bg-background border-border text-foreground"
        />
        <p className="text-sm text-muted-foreground">
          Collez l'URL complète de Wistia ou juste l'ID de la vidéo
        </p>
        {previewWistiaId && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2 text-foreground">Aperçu de la vidéo :</p>
            <div className="aspect-video bg-background rounded-lg overflow-hidden">
              <wistia-player
                media-id={previewWistiaId}
                seo={true}
                aspect={1.78}
                className="w-full h-full"
              />
            </div>
          </div>
        )}
      </div>

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

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Enregistrement...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Enregistrer Section Hero
          </>
        )}
      </Button>
    </div>
  );
};
