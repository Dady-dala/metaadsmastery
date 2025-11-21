import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Award, Palette, FileText, User } from 'lucide-react';

interface CertificateSettings {
  id: string;
  primary_color: string;
  accent_color: string;
  background_color: string;
  organization_name: string;
  organization_subtitle: string;
  trainer_name: string;
  certificate_title: string;
  logo_url: string | null;
}

export const CertificateSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CertificateSettings>({
    id: '',
    primary_color: '#6B21A8',
    accent_color: '#22C55E',
    background_color: '#1A0B2E',
    organization_name: 'Meta Ads Mastery',
    organization_subtitle: 'Formation professionnelle en publicité Meta',
    trainer_name: 'Formateur Expert',
    certificate_title: 'CERTIFICAT DE RÉUSSITE',
    logo_url: null,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('certificate_settings')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading certificate settings:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('certificate_settings')
        .update({
          primary_color: settings.primary_color,
          accent_color: settings.accent_color,
          background_color: settings.background_color,
          organization_name: settings.organization_name,
          organization_subtitle: settings.organization_subtitle,
          trainer_name: settings.trainer_name,
          certificate_title: settings.certificate_title,
          logo_url: settings.logo_url,
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast.success('Paramètres de certificat sauvegardés avec succès');
    } catch (error: any) {
      console.error('Error saving certificate settings:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Couleurs */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Couleurs du certificat
          </CardTitle>
          <CardDescription className="text-gray-300">
            Personnalisez les couleurs de vos certificats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="primary_color" className="text-gray-300">Couleur primaire</Label>
              <div className="flex gap-2 items-center mt-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  className="w-20 h-10 bg-white/5 border-white/10"
                />
                <Input
                  type="text"
                  value={settings.primary_color}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  className="flex-1 bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="accent_color" className="text-gray-300">Couleur accent</Label>
              <div className="flex gap-2 items-center mt-2">
                <Input
                  id="accent_color"
                  type="color"
                  value={settings.accent_color}
                  onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                  className="w-20 h-10 bg-white/5 border-white/10"
                />
                <Input
                  type="text"
                  value={settings.accent_color}
                  onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                  className="flex-1 bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="background_color" className="text-gray-300">Couleur de fond</Label>
              <div className="flex gap-2 items-center mt-2">
                <Input
                  id="background_color"
                  type="color"
                  value={settings.background_color}
                  onChange={(e) => setSettings({ ...settings, background_color: e.target.value })}
                  className="w-20 h-10 bg-white/5 border-white/10"
                />
                <Input
                  type="text"
                  value={settings.background_color}
                  onChange={(e) => setSettings({ ...settings, background_color: e.target.value })}
                  className="flex-1 bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations de l'organisation */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Informations de l'organisation
          </CardTitle>
          <CardDescription className="text-gray-300">
            Détails affichés sur le certificat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="certificate_title" className="text-gray-300">Titre du certificat</Label>
            <Input
              id="certificate_title"
              value={settings.certificate_title}
              onChange={(e) => setSettings({ ...settings, certificate_title: e.target.value })}
              placeholder="CERTIFICAT DE RÉUSSITE"
              className="bg-white/5 border-white/10 text-white mt-2"
            />
          </div>
          <div>
            <Label htmlFor="organization_name" className="text-gray-300">Nom de l'organisation</Label>
            <Input
              id="organization_name"
              value={settings.organization_name}
              onChange={(e) => setSettings({ ...settings, organization_name: e.target.value })}
              placeholder="Meta Ads Mastery"
              className="bg-white/5 border-white/10 text-white mt-2"
            />
          </div>
          <div>
            <Label htmlFor="organization_subtitle" className="text-gray-300">Sous-titre</Label>
            <Input
              id="organization_subtitle"
              value={settings.organization_subtitle}
              onChange={(e) => setSettings({ ...settings, organization_subtitle: e.target.value })}
              placeholder="Formation professionnelle en publicité Meta"
              className="bg-white/5 border-white/10 text-white mt-2"
            />
          </div>
          <div>
            <Label htmlFor="logo_url" className="text-gray-300">URL du logo (optionnel)</Label>
            <Input
              id="logo_url"
              value={settings.logo_url || ''}
              onChange={(e) => setSettings({ ...settings, logo_url: e.target.value || null })}
              placeholder="https://..."
              className="bg-white/5 border-white/10 text-white mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Formateur */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Informations du formateur
          </CardTitle>
          <CardDescription className="text-gray-300">
            Signature du formateur sur le certificat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="trainer_name" className="text-gray-300">Nom du formateur</Label>
            <Input
              id="trainer_name"
              value={settings.trainer_name}
              onChange={(e) => setSettings({ ...settings, trainer_name: e.target.value })}
              placeholder="Formateur Expert"
              className="bg-white/5 border-white/10 text-white mt-2"
            />
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="bg-[#00ff87] text-black hover:bg-[#00cc6e] w-full"
      >
        {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
      </Button>
    </div>
  );
};