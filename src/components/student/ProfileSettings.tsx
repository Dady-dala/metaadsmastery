import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Mail, Lock, Moon, Sun, Globe, Award, Download, Calendar, Users } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Certificate {
  id: string;
  course_id: string;
  certificate_url: string;
  issued_at: string;
  courses: {
    title: string;
  };
}

interface Profile {
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
}

export const ProfileSettings = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState('fr');
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [profile, setProfile] = useState<Profile>({
    first_name: '',
    last_name: '',
    date_of_birth: null,
    gender: null,
  });

  useEffect(() => {
    loadProfile();
    loadCertificates();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email || '');
      
      // Charger les données du profil
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, date_of_birth, gender')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      } else if (profileData) {
        setProfile({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          date_of_birth: profileData.date_of_birth || null,
          gender: profileData.gender || null,
        });
      }
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          date_of_birth: profile.date_of_birth,
          gender: profile.gender,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success('Profil mis à jour avec succès');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const loadCertificates = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('certificates')
      .select(`
        id,
        course_id,
        certificate_url,
        issued_at,
        courses (
          title
        )
      `)
      .eq('student_id', session.user.id)
      .order('issued_at', { ascending: false });

    if (error) {
      console.error('Error loading certificates:', error);
      toast.error('Erreur lors du chargement des certificats');
    } else if (data) {
      setCertificates(data as Certificate[]);
    }
  };

  const downloadCertificate = (certificateUrl: string, courseTitle: string) => {
    const link = document.createElement('a');
    link.href = certificateUrl;
    link.download = `Certificat-${courseTitle.replace(/\s+/g, '-')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Téléchargement du certificat en cours...');
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      toast.success('Mot de passe mis à jour avec succès');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Erreur lors de la mise à jour du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profil */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <User className="w-5 h-5" />
            Profil
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Complétez vos informations personnelles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="bg-muted border-border text-muted-foreground mt-2"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name" className="text-foreground">Prénom</Label>
              <Input
                id="first_name"
                value={profile.first_name}
                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                placeholder="Votre prénom"
                className="bg-input border-border text-foreground mt-2"
              />
            </div>
            <div>
              <Label htmlFor="last_name" className="text-foreground">Nom</Label>
              <Input
                id="last_name"
                value={profile.last_name}
                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                placeholder="Votre nom"
                className="bg-input border-border text-foreground mt-2"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="date_of_birth" className="text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date de naissance
            </Label>
            <Input
              id="date_of_birth"
              type="date"
              value={profile.date_of_birth || ''}
              onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value || null })}
              className="bg-input border-border text-foreground mt-2"
            />
          </div>
          <div>
            <Label className="text-foreground flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" />
              Sexe
            </Label>
            <Select value={profile.gender || 'non-specifie'} onValueChange={(value) => setProfile({ ...profile, gender: value })}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="homme">Homme</SelectItem>
                <SelectItem value="femme">Femme</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
                <SelectItem value="non-specifie">Non spécifié</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </CardContent>
      </Card>

      {/* Changer le mot de passe */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Sécurité
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Modifiez votre mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="new-password" className="text-foreground">
              Nouveau mot de passe
            </Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-input border-border text-foreground mt-2"
              placeholder="Minimum 6 caractères"
            />
          </div>
          <div>
            <Label htmlFor="confirm-password" className="text-foreground">
              Confirmer le mot de passe
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-input border-border text-foreground mt-2"
              placeholder="Confirmez votre mot de passe"
            />
          </div>
          <Button
            onClick={handlePasswordUpdate}
            disabled={loading || !newPassword || !confirmPassword}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </Button>
        </CardContent>
      </Card>

      {/* Apparence et Langue */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Moon className="w-5 h-5" />
            Préférences
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Personnalisez votre expérience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-foreground flex items-center gap-2 mb-2">
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              Thème
            </Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Clair</SelectItem>
                <SelectItem value="dark">Sombre</SelectItem>
                <SelectItem value="system">Système</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-foreground flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4" />
              Langue
            </Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Certificats */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Award className="w-5 h-5" />
            Mes Certificats
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Vos certificats de réussite
          </CardDescription>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun certificat pour le moment. Complétez vos cours pour obtenir vos certificats !
            </p>
          ) : (
            <div className="space-y-4">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Award className="w-8 h-8 text-primary" />
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {cert.courses.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Délivré le {new Date(cert.issued_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => downloadCertificate(cert.certificate_url, cert.courses.title)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
