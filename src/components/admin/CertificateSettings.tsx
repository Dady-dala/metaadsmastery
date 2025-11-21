import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Award, Palette, FileText, User, Upload, Eye } from 'lucide-react';
import { generateCertificate } from '@/utils/certificateGenerator';

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
  trainer_signature_url: string | null;
}

export const CertificateSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
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
    trainer_signature_url: null,
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 2 MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('certificate-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('certificate-logos')
        .getPublicUrl(filePath);

      setSettings({ ...settings, logo_url: publicUrl });
      toast.success('Logo uploadé avec succès');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(error.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 2 MB');
      return;
    }

    setUploadingSignature(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `signature-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('certificate-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('certificate-logos')
        .getPublicUrl(filePath);

      setSettings({ ...settings, trainer_signature_url: publicUrl });
      toast.success('Signature uploadée avec succès');
    } catch (error: any) {
      console.error('Error uploading signature:', error);
      toast.error(error.message || 'Erreur lors de l\'upload');
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleGeneratePreview = async () => {
    try {
      // Sauvegarder temporairement les paramètres dans la base de données
      await supabase
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
          trainer_signature_url: settings.trainer_signature_url,
        })
        .eq('id', settings.id);

      // Générer un aperçu avec des données fictives
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const pdfDataUri = await generateCertificate({
        studentId: user.id, // Admin ID pour l'aperçu
        courseName: 'Exemple de Formation',
        completionDate: new Date().toLocaleDateString('fr-FR')
      });

      setPreviewUrl(pdfDataUri);
      toast.success('Aperçu généré avec succès');
    } catch (error: any) {
      console.error('Error generating preview:', error);
      toast.error(error.message || 'Erreur lors de la génération de l\'aperçu');
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
          trainer_signature_url: settings.trainer_signature_url,
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
      {/* Aperçu */}
      {previewUrl && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Aperçu du certificat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-[1.414/1] bg-black/20 rounded-lg overflow-hidden">
              <iframe
                src={previewUrl}
                className="w-full h-full"
                title="Aperçu du certificat"
              />
            </div>
          </CardContent>
        </Card>
      )}

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
            <Label htmlFor="logo_upload" className="text-gray-300">Logo (optionnel)</Label>
            <div className="flex gap-2 items-center mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Upload...' : 'Uploader un logo'}
              </Button>
              {settings.logo_url && (
                <div className="flex items-center gap-2">
                  <img src={settings.logo_url} alt="Logo" className="w-10 h-10 object-contain rounded border border-white/10" />
                  <span className="text-sm text-gray-400">Logo actuel</span>
                </div>
              )}
            </div>
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
            <p className="text-xs text-gray-400 mt-1">Affiché si aucune signature numérisée n'est uploadée</p>
          </div>
          <div>
            <Label htmlFor="signature_upload" className="text-gray-300">Signature numérisée (optionnel)</Label>
            <div className="flex gap-2 items-center mt-2">
              <input
                ref={signatureInputRef}
                type="file"
                accept="image/*"
                onChange={handleSignatureUpload}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => signatureInputRef.current?.click()}
                disabled={uploadingSignature}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadingSignature ? 'Upload...' : 'Uploader une signature'}
              </Button>
              {settings.trainer_signature_url && (
                <div className="flex items-center gap-2">
                  <img src={settings.trainer_signature_url} alt="Signature" className="h-12 object-contain rounded border border-white/10 bg-white px-2" />
                  <Button
                    type="button"
                    onClick={() => setSettings({ ...settings, trainer_signature_url: null })}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    Supprimer
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Recommandé : image PNG transparente pour un meilleur rendu</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          onClick={handleGeneratePreview}
          variant="outline"
          className="bg-white/5 border-white/10 text-white hover:bg-white/10 flex-1"
        >
          <Eye className="w-4 h-4 mr-2" />
          Générer un aperçu
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#00ff87] text-black hover:bg-[#00cc6e] flex-1"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </Button>
      </div>
    </div>
  );
};