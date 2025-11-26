import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';

interface Props {
  onSave?: () => void;
}

export const ServicesSectionEditor = ({ onSave }: Props) => {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-border">
        <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <Label className="text-foreground font-medium">Section Services</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Cette section contient les problèmes résolus, les apprentissages, les modules de formation, 
            les bonus et les différenciateurs. Pour modifier le contenu détaillé de cette section, 
            veuillez modifier le composant Services.tsx directement.
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        La gestion avancée de cette section sera disponible prochainement avec un éditeur complet.
      </p>
    </div>
  );
};
