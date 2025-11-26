import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Loader2, Plus, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FAQ {
  question: string;
  answer: string;
}

interface Props {
  onSave?: () => void;
}

export const FAQSectionEditor = ({ onSave }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('*')
        .eq('section_key', 'faq')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.content) {
        const content = data.content as any;
        setFaqs(content.faqs || []);
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
        .eq('section_key', 'faq')
        .single();

      const payload = {
        section_key: 'faq',
        section_type: 'faq',
        title: 'FAQ',
        content: {
          faqs
        } as any,
        is_active: true,
        order_index: 3
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

      toast.success('Section FAQ enregistrée');
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
    const reordered = Array.from(faqs);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setFaqs(reordered);
  };

  const addFaq = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
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
        <Label className="text-foreground">Questions Fréquentes</Label>
        <Button size="sm" variant="outline" onClick={addFaq}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une question
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="faqs">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {faqs.map((faq, index) => (
                <Draggable key={index} draggableId={`faq-${index}`} index={index}>
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
                          <CardTitle className="text-sm">Question {index + 1}</CardTitle>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setFaqs(faqs.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Question</Label>
                          <Input
                            value={faq.question}
                            onChange={(e) => {
                              const updated = [...faqs];
                              updated[index].question = e.target.value;
                              setFaqs(updated);
                            }}
                            placeholder="Posez votre question..."
                            className="bg-background border-border"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Réponse</Label>
                          <Textarea
                            value={faq.answer}
                            onChange={(e) => {
                              const updated = [...faqs];
                              updated[index].answer = e.target.value;
                              setFaqs(updated);
                            }}
                            placeholder="La réponse à la question..."
                            className="min-h-[100px] bg-background border-border"
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
            Enregistrer Section FAQ
          </>
        )}
      </Button>
    </div>
  );
};
