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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Vous devez être connecté pour accéder à cette page');
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

        if (roleError || !roleData) {
          toast.error("Accès refusé : vous n'avez pas les droits nécessaires");
          navigate('/');
          return;
        }
      }

      setHasAccess(true);
    } catch (error) {
      toast.error('Erreur lors de la vérification des droits');
      navigate('/');
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
