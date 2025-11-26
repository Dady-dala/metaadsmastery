import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const LivePreview = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for iframe
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="bg-card border-border overflow-hidden">
      <div className="bg-muted px-4 py-2 border-b border-border">
        <p className="text-sm font-medium text-foreground">Aperçu en Direct</p>
        <p className="text-xs text-muted-foreground">
          Actualisez après sauvegarde pour voir les modifications
        </p>
      </div>
      
      <div className="relative bg-background" style={{ height: 'calc(100vh - 200px)' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <iframe
          src="/"
          className="w-full h-full border-0"
          title="Aperçu de la page d'accueil"
          onLoad={() => setLoading(false)}
        />
      </div>
    </Card>
  );
};
