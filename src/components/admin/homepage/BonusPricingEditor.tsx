import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save, Loader2, Plus, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  onSave?: () => void;
}

export const BonusPricingEditor = ({ onSave }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bonuses, setBonuses] = useState<Array<{ title: string; value: string }>>([]);
  const [pricing, setPricing] = useState({
    originalPrice: '229',
    discountedPrice: '49.99',
    ctaText: 'Je Rejoins Meta Ads Mastery Maintenant →',
    countdownEndDate: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('*')
        .eq('section_key', 'bonus_pricing')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.content) {
        const content = data.content as any;
        setBonuses(content.bonuses || []);
        setPricing(content.pricing || pricing);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('landing_page_sections')
        .select('id')
        .eq('section_key', 'bonus_pricing')
        .single();

      const payload = {
        section_key: 'bonus_pricing',
        section_type: 'bonus_pricing',
        title: 'Bonus et Prix',
        content: {
          bonuses,
          pricing
        } as any,
        is_active: true,
        order_index: 5
      };

      let error;
      if (existing) {
        ({ error } = await supabase
          .from('landing_page_sections')
          .update(payload)
          .eq('id', existing.id));
      } else {
        ({ error } = await supabase
          .from('landing_page_sections')
          .insert(payload));
      }

      if (error) throw error;

      toast.success('Bonus et Prix enregistrés');
      onSave?.();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = Array.from(bonuses);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setBonuses(reordered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="bonuses" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="bonuses">Bonus Exclusifs</TabsTrigger>
          <TabsTrigger value="pricing">Prix & Timer</TabsTrigger>
        </TabsList>

        <TabsContent value="bonuses" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <Label className="text-foreground">Liste des Bonus</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBonuses([...bonuses, { title: '', value: '' }])}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter Bonus
            </Button>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="bonuses">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {bonuses.map((bonus, index) => (
                    <Draggable key={index} draggableId={`bonus-${index}`} index={index}>
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="bg-card border-border"
                        >
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setBonuses(bonuses.filter((_, i) => i !== index))}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Titre du Bonus</Label>
                              <Input
                                value={bonus.title}
                                onChange={(e) => {
                                  const updated = [...bonuses];
                                  updated[index].title = e.target.value;
                                  setBonuses(updated);
                                }}
                                placeholder="Ex: Templates de Campagnes Prêts à l'Emploi"
                                className="bg-background border-border"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Valeur</Label>
                              <Input
                                value={bonus.value}
                                onChange={(e) => {
                                  const updated = [...bonuses];
                                  updated[index].value = e.target.value;
                                  setBonuses(updated);
                                }}
                                placeholder="Ex: Valeur $25"
                                className="bg-background border-border"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Prix Original (barré)</Label>
                <Input
                  type="text"
                  value={pricing.originalPrice}
                  onChange={(e) => setPricing({ ...pricing, originalPrice: e.target.value })}
                  placeholder="229"
                  className="bg-background border-border"
                />
                <p className="text-xs text-muted-foreground">Afficher avec $ devant (ex: $229)</p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Prix Promotionnel</Label>
                <Input
                  type="text"
                  value={pricing.discountedPrice}
                  onChange={(e) => setPricing({ ...pricing, discountedPrice: e.target.value })}
                  placeholder="49.99"
                  className="bg-background border-border"
                />
                <p className="text-xs text-muted-foreground">Afficher avec $ devant (ex: $49.99)</p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Date de Fin du Timer</Label>
                <Input
                  type="datetime-local"
                  value={pricing.countdownEndDate}
                  onChange={(e) => setPricing({ ...pricing, countdownEndDate: e.target.value })}
                  className="bg-background border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Sélectionner une date/heure pour le compte à rebours
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Texte du Bouton CTA</Label>
                <Input
                  type="text"
                  value={pricing.ctaText}
                  onChange={(e) => setPricing({ ...pricing, ctaText: e.target.value })}
                  placeholder="Je Rejoins Meta Ads Mastery Maintenant →"
                  className="bg-background border-border"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Enregistrement...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Enregistrer Bonus & Prix
          </>
        )}
      </Button>
    </div>
  );
};
