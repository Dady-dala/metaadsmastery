import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isConnectedWithoutRole, setIsConnectedWithoutRole] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté avec un rôle assigné
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Si erreur ou pas de session, nettoyer l'état
        if (sessionError || !session) {
          setIsConnectedWithoutRole(false);
          return;
        }

        // Valider que la session est toujours active en testant une requête
        const { error: testError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .limit(1);

        // Si la requête échoue (token invalide), nettoyer la session
        if (testError) {
          console.error('Session invalide, déconnexion:', testError);
          await supabase.auth.signOut();
          setIsConnectedWithoutRole(false);
          return;
        }

        // Vérifier le rôle de l'utilisateur
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        // Rediriger SEULEMENT si un rôle est assigné
        if (roleData) {
          if (roleData.role === 'admin') {
            navigate('/admin');
          } else if (roleData.role === 'student') {
            navigate('/espace-formation');
          } else {
            navigate('/');
          }
        } else {
          // Utilisateur connecté sans rôle
          setIsConnectedWithoutRole(true);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de session:', error);
        await supabase.auth.signOut();
        setIsConnectedWithoutRole(false);
      }
    };

    checkSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && event === 'SIGNED_IN') {
        // Utiliser setTimeout pour éviter les problèmes de deadlock
        setTimeout(async () => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (roleData) {
            if (roleData.role === 'admin') {
              navigate('/admin');
            } else if (roleData.role === 'student') {
              toast.success('Connexion réussie !');
              navigate('/espace-formation');
            } else {
              toast.success('Connexion réussie !');
              navigate('/');
            }
          } else {
            // Informer l'utilisateur qu'il doit attendre l'assignation d'un rôle
            toast.info("Compte créé ! En attente d'assignation de rôle par l'administrateur.");
          }
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsConnectedWithoutRole(false);
    toast.success('Déconnexion réussie');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Veuillez entrer votre adresse email');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('request-password-reset', {
        body: { email }
      });

      if (error) throw error;

      toast.success('Email de réinitialisation envoyé ! Vérifiez votre boîte de réception.');
      setShowForgotPassword(false);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      toast.error('Erreur lors de l\'envoi de l\'email de réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Email ou mot de passe incorrect');
          } else {
            toast.error(error.message);
          }
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Un compte existe déjà avec cet email');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Compte créé avec succès ! Connectez-vous pour accéder à votre espace.');
          setIsLogin(true);
        }
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Connexion - Meta Ads Mastery"
        description="Accédez à votre espace administrateur Meta Ads Mastery"
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0033] via-[#2d0052] to-[#1a0033] p-4">
        <Card className="w-full max-w-md">
          {isConnectedWithoutRole ? (
            <>
              <CardHeader>
                <CardTitle className="text-2xl text-center">
                  Compte en attente
                </CardTitle>
                <CardDescription className="text-center">
                  Votre compte a été créé avec succès
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 text-center">
                    Votre compte est en attente d'assignation de rôle par l'administrateur. 
                    Vous recevrez un accès dès que votre rôle sera configuré.
                  </p>
                </div>
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full"
                >
                  Se déconnecter
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-2xl text-center">
                  {showForgotPassword ? 'Réinitialiser le mot de passe' : (isLogin ? 'Connexion' : 'Inscription')}
                </CardTitle>
                <CardDescription className="text-center">
                  {showForgotPassword 
                    ? 'Entrez votre email pour recevoir un lien de réinitialisation'
                    : (isLogin 
                      ? 'Connectez-vous à votre espace'
                      : 'Créez votre compte')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showForgotPassword ? (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre-email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setShowForgotPassword(false)}
                    >
                      Retour à la connexion
                    </Button>
                  </form>
                ) : (
                  <>
                    <form onSubmit={handleAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
                  </Button>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-primary hover:underline w-full text-center"
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                    </form>
                    <div className="mt-4 text-center text-sm">
                      <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-primary hover:underline"
                      >
                        {isLogin 
                          ? "Pas encore de compte ? S'inscrire"
                          : 'Déjà un compte ? Se connecter'}
                      </button>
                    </div>
                  </>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </>
  );
};

export default Auth;