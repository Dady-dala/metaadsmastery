import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si nous avons un token dans l'URL
    const token = searchParams.get('token');
    
    if (token) {
      setHasToken(true);
    } else {
      toast.error('Lien de réinitialisation invalide ou expiré');
      setTimeout(() => navigate('/auth'), 2000);
    }
  }, [navigate, searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const token = searchParams.get('token');
      
      const { data, error } = await supabase.functions.invoke('verify-reset-token', {
        body: { 
          token,
          newPassword
        }
      });

      if (error) throw error;

      toast.success('Mot de passe réinitialisé avec succès !');
      
      setTimeout(() => {
        navigate('/auth');
      }, 1500);
    } catch (error: any) {
      console.error('Erreur lors de la réinitialisation:', error);
      toast.error(error.message || 'Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  if (!hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0033] via-[#2d0052] to-[#1a0033] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Vérification du lien...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Réinitialiser le mot de passe - Meta Ads Mastery"
        description="Réinitialisez votre mot de passe Meta Ads Mastery"
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0033] via-[#2d0052] to-[#1a0033] p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Nouveau mot de passe
            </CardTitle>
            <CardDescription className="text-center">
              Choisissez un nouveau mot de passe pour votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ResetPassword;
