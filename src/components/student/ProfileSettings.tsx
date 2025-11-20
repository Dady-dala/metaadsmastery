import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Mail, Lock, Moon, Sun, Globe } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const ProfileSettings = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email || '');
    }
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
            Informations de votre compte
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
    </div>
  );
};
