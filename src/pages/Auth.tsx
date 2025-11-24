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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
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
                    
                    {/* Google Sign In */}
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Ou continuer avec</span>
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        try {
                          const { error } = await supabase.auth.signInWithOAuth({
                            provider: 'google',
                            options: {
                              redirectTo: `${window.location.origin}/auth`,
                            },
                          });
                          if (error) throw error;
                        } catch (error) {
                          console.error('Erreur connexion Google:', error);
                          toast.error('Erreur lors de la connexion avec Google');
                        }
                      }}
                      disabled={loading}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Se connecter avec Google
                    </Button>
                    
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