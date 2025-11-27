import { Button } from '@/components/ui/button';
import { Edit3, Eye, Save, X } from 'lucide-react';
import { useEditMode } from '@/contexts/EditModeContext';
import { toast } from 'sonner';

export const EditModeBar = () => {
  const { isEditMode, setIsEditMode, isAdmin } = useEditMode();

  if (!isAdmin) return null;

  const handleToggleEdit = () => {
    if (isEditMode) {
      toast.success('Mode visualisation activé');
    } else {
      toast.success('Mode édition activé - Cliquez sur les sections pour les modifier');
    }
    setIsEditMode(!isEditMode);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold">
            {isEditMode ? 'Mode Édition' : 'Page d\'accueil'}
          </span>
          {isEditMode && (
            <span className="text-sm opacity-90">
              Cliquez sur une section pour la modifier
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isEditMode ? 'secondary' : 'default'}
            onClick={handleToggleEdit}
            className="gap-2"
          >
            {isEditMode ? (
              <>
                <Eye className="w-4 h-4" />
                Visualiser
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                Modifier
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
