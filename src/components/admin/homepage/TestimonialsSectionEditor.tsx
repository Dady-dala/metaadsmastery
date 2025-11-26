import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Loader2, Plus, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RichTextEditor from '@/components/admin/RichTextEditor';

interface Testimonial {
  name: string;
  location: string;
  business: string;
  image: string;
  result: string;
  investment: string;
  revenue: string;
  testimonial: string;
}

interface Props {
  onSave?: () => void;
}

export const TestimonialsSectionEditor = ({ onSave }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('*')
        .eq('section_key', 'testimonials')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.content) {
        const content = data.content as any;
        setTestimonials(content.testimonials || []);
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
        .eq('section_key', 'testimonials')
        .single();

      const payload = {
        section_key: 'testimonials',
        section_type: 'testimonials',
        title: 'Testimonials',
        content: {
          testimonials
        } as any,
        is_active: true,
        order_index: 2
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

      toast.success('Section Témoignages enregistrée');
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
    const reordered = Array.from(testimonials);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setTestimonials(reordered);
  };

  const addTestimonial = () => {
    setTestimonials([
      ...testimonials,
      {
        name: '',
        location: '',
        business: '',
        image: '',
        result: '',
        investment: '',
        revenue: '',
        testimonial: ''
      }
    ]);
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
      <div className="flex items-center justify-between">
        <Label className="text-foreground">Témoignages Clients</Label>
        <Button size="sm" variant="outline" onClick={addTestimonial}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un témoignage
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="testimonials">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {testimonials.map((testimonial, index) => (
                <Draggable key={index} draggableId={`testimonial-${index}`} index={index}>
                  {(provided) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="bg-card border-border"
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                          <div {...provided.dragHandleProps}>
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <CardTitle className="text-sm">Témoignage {index + 1}</CardTitle>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setTestimonials(testimonials.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm">Nom</Label>
                            <Input
                              value={testimonial.name}
                              onChange={(e) => {
                                const updated = [...testimonials];
                                updated[index].name = e.target.value;
                                setTestimonials(updated);
                              }}
                              placeholder="Aminata D."
                              className="bg-background border-border"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Localisation</Label>
                            <Input
                              value={testimonial.location}
                              onChange={(e) => {
                                const updated = [...testimonials];
                                updated[index].location = e.target.value;
                                setTestimonials(updated);
                              }}
                              placeholder="Dakar, Sénégal"
                              className="bg-background border-border"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm">Business</Label>
                            <Input
                              value={testimonial.business}
                              onChange={(e) => {
                                const updated = [...testimonials];
                                updated[index].business = e.target.value;
                                setTestimonials(updated);
                              }}
                              placeholder="E-commerce Mode"
                              className="bg-background border-border"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">URL Image</Label>
                            <Input
                              value={testimonial.image}
                              onChange={(e) => {
                                const updated = [...testimonials];
                                updated[index].image = e.target.value;
                                setTestimonials(updated);
                              }}
                              placeholder="/lovable-uploads/..."
                              className="bg-background border-border"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Résultat</Label>
                          <Input
                            value={testimonial.result}
                            onChange={(e) => {
                              const updated = [...testimonials];
                              updated[index].result = e.target.value;
                              setTestimonials(updated);
                            }}
                            placeholder="+340% de ventes en 2 mois"
                            className="bg-background border-border"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm">Investissement</Label>
                            <Input
                              value={testimonial.investment}
                              onChange={(e) => {
                                const updated = [...testimonials];
                                updated[index].investment = e.target.value;
                                setTestimonials(updated);
                              }}
                              placeholder="Budget pub: $150/mois"
                              className="bg-background border-border"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Revenus</Label>
                            <Input
                              value={testimonial.revenue}
                              onChange={(e) => {
                                const updated = [...testimonials];
                                updated[index].revenue = e.target.value;
                                setTestimonials(updated);
                              }}
                              placeholder="Revenus générés: $2,800/mois"
                              className="bg-background border-border"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Témoignage</Label>
                          <RichTextEditor
                            value={testimonial.testimonial}
                            onChange={(value) => {
                              const updated = [...testimonials];
                              updated[index].testimonial = value;
                              setTestimonials(updated);
                            }}
                            placeholder="Le témoignage complet du client..."
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

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Enregistrement...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Enregistrer Section Témoignages
          </>
        )}
      </Button>
    </div>
  );
};
