import { useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'student';
  redirectTo?: string;
}

const ProtectedRoute = ({ children, requiredRole, redirectTo = '/auth' }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // Si erreur de session ou pas de session, rediriger
      if (sessionError || !session) {
        toast.error('Session expirée, veuillez vous reconnecter');
        await supabase.auth.signOut();
        navigate(redirectTo);
        return;
      }

      if (requiredRole) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', requiredRole)
          .eq('is_active', true)
          .single();

        // Si erreur JWT ou token invalide, nettoyer la session
        if (roleError) {
          if (roleError.message?.includes('JWT') || roleError.message?.includes('token')) {
            toast.error('Session expirée, reconnexion nécessaire');
            await supabase.auth.signOut();
            navigate(redirectTo);
            return;
          }
          if (!roleData) {
            toast.error("Accès refusé : vous n'avez pas les droits nécessaires");
            navigate('/');
            return;
          }
        }
      }

      setHasAccess(true);
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      toast.error('Erreur lors de la vérification des droits');
      await supabase.auth.signOut();
      navigate(redirectTo);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0033] via-[#2d0052] to-[#1a0033]">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
