import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SectionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionKey: string;
  onSaved: () => void;
}

export const SectionEditModal = ({
  isOpen,
  onClose,
  sectionId,
  sectionKey,
  onSaved,
}: SectionEditModalProps) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    title: '',
    subtitle: '',
    media_url: '',
    content: {} as any,
  });

  useEffect(() => {
    if (isOpen && sectionId) {
      loadSectionData();
    }
  }, [isOpen, sectionId]);

  const loadSectionData = async () => {
    setLoading(true);
    try {
      const { data: section, error } = await supabase
        .from('landing_page_sections')
        .select('*')
        .eq('id', sectionId)
        .single();

      if (error) throw error;

      setData({
        title: section.title || '',
        subtitle: section.subtitle || '',
        media_url: section.media_url || '',
        content: section.content || {},
      });
    } catch (error) {
      console.error('Erreur chargement section:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('landing_page_sections')
        .update({
          title: data.title,
          subtitle: data.subtitle,
          media_url: data.media_url,
          content: data.content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sectionId);

      if (error) throw error;

      toast.success('Section mise à jour avec succès');
      onSaved();
      onClose();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la section {sectionKey}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Titre principal</Label>
              <RichTextEditor
                value={data.title}
                onChange={(value) => setData({ ...data, title: value })}
                placeholder="Titre de la section"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="subtitle">Sous-titre</Label>
              <RichTextEditor
                value={data.subtitle}
                onChange={(value) => setData({ ...data, subtitle: value })}
                placeholder="Sous-titre de la section"
                className="mt-2"
              />
            </div>

            {sectionKey === 'hero' && (
              <>
                <div>
                  <Label htmlFor="media_url">ID Média Wistia</Label>
                  <Input
                    id="media_url"
                    value={data.media_url}
                    onChange={(e) => setData({ ...data, media_url: e.target.value })}
                    placeholder="ID de la vidéo Wistia"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Texte CTA</Label>
                  <Input
                    value={data.content.ctaText || ''}
                    onChange={(e) =>
                      setData({
                        ...data,
                        content: { ...data.content, ctaText: e.target.value },
                      })
                    }
                    placeholder="Texte du bouton d'action"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Titre section logos</Label>
                  <Input
                    value={data.content.logosTitle || ''}
                    onChange={(e) =>
                      setData({
                        ...data,
                        content: { ...data.content, logosTitle: e.target.value },
                      })
                    }
                    placeholder="Titre pour la section des logos"
                    className="mt-2"
                  />
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
