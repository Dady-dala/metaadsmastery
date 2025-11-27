import React, { useState } from 'react';
import { useEditMode } from '@/contexts/EditModeContext';
import { Edit3, GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionEditModal } from './SectionEditModal';
import { cn } from '@/lib/utils';

interface EditableSectionProps {
  children: React.ReactNode;
  sectionId: string;
  sectionKey: string;
  onDelete?: () => void;
  onUpdate?: () => void;
  className?: string;
}

export const EditableSection: React.FC<EditableSectionProps> = ({
  children,
  sectionId,
  sectionKey,
  onDelete,
  onUpdate,
  className,
}) => {
  const { isEditMode, isAdmin } = useEditMode();
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isAdmin) {
    return <>{children}</>;
  }

  const handleSaved = () => {
    if (onUpdate) {
      onUpdate();
    }
    // Recharger la page pour voir les changements
    window.location.reload();
  };

  return (
    <div
      className={cn(
        'relative',
        isEditMode && 'hover:outline hover:outline-2 hover:outline-primary hover:outline-offset-4',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isEditMode && isHovered && (
        <div className="absolute top-2 right-2 z-50 flex gap-2 bg-background/95 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-border">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsModalOpen(true)}
            className="gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Modifier
          </Button>
          {onDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onDelete}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <div className="flex items-center cursor-move">
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      )}

      {children}

      <SectionEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sectionId={sectionId}
        sectionKey={sectionKey}
        onSaved={handleSaved}
      />
    </div>
  );
};
