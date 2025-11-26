import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save, Loader2, Plus, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  onSave?: () => void;
}

export const ServicesSectionEditor = ({ onSave }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [learnings, setLearnings] = useState<string[]>([]);
  const [modules, setModules] = useState<Array<{ number: string; title: string; description: string }>>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('*')
        .eq('section_key', 'services')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.content) {
        const content = data.content as any;
        setProblems(content.problems || []);
        setLearnings(content.learnings || []);
        setModules(content.modules || []);
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
        .eq('section_key', 'services')
        .single();

      const payload = {
        section_key: 'services',
        section_type: 'services',
        title: 'Services',
        content: {
          problems,
          learnings,
          modules
        } as any,
        is_active: true,
        order_index: 1
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

      toast.success('Section Services enregistrée');
      onSave?.();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const onDragEnd = (result: any, items: any[], setItems: any) => {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setItems(reordered);
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
      <Tabs defaultValue="problems" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted">
          <TabsTrigger value="problems">Problèmes</TabsTrigger>
          <TabsTrigger value="learnings">Apprentissages</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
        </TabsList>

        <TabsContent value="problems" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <Label className="text-foreground">Problèmes Résolus</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setProblems([...problems, ''])}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>

          <DragDropContext onDragEnd={(result) => onDragEnd(result, problems, setProblems)}>
            <Droppable droppableId="problems">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {problems.map((problem, index) => (
                    <Draggable key={index} draggableId={`problem-${index}`} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="flex gap-2 items-start"
                        >
                          <div {...provided.dragHandleProps} className="mt-3">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <Textarea
                            value={problem}
                            onChange={(e) => {
                              const updated = [...problems];
                              updated[index] = e.target.value;
                              setProblems(updated);
                            }}
                            placeholder="Décrivez un problème..."
                            className="flex-1 bg-background border-border text-foreground"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setProblems(problems.filter((_, i) => i !== index))}
                            className="mt-2"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </TabsContent>

        <TabsContent value="learnings" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <Label className="text-foreground">Ce Que Tu Vas Apprendre</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLearnings([...learnings, ''])}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>

          <DragDropContext onDragEnd={(result) => onDragEnd(result, learnings, setLearnings)}>
            <Droppable droppableId="learnings">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {learnings.map((learning, index) => (
                    <Draggable key={index} draggableId={`learning-${index}`} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="flex gap-2 items-start"
                        >
                          <div {...provided.dragHandleProps} className="mt-3">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <Textarea
                            value={learning}
                            onChange={(e) => {
                              const updated = [...learnings];
                              updated[index] = e.target.value;
                              setLearnings(updated);
                            }}
                            placeholder="Décrivez un apprentissage..."
                            className="flex-1 bg-background border-border text-foreground"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setLearnings(learnings.filter((_, i) => i !== index))}
                            className="mt-2"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <Label className="text-foreground">Modules de Formation</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setModules([...modules, { number: '', title: '', description: '' }])}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>

          <DragDropContext onDragEnd={(result) => onDragEnd(result, modules, setModules)}>
            <Droppable droppableId="modules">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {modules.map((module, index) => (
                    <Draggable key={index} draggableId={`module-${index}`} index={index}>
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
                              <CardTitle className="text-sm">Module {index + 1}</CardTitle>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setModules(modules.filter((_, i) => i !== index))}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <Label className="text-sm">Numéro</Label>
                              <Input
                                value={module.number}
                                onChange={(e) => {
                                  const updated = [...modules];
                                  updated[index].number = e.target.value;
                                  setModules(updated);
                                }}
                                placeholder="01"
                                className="bg-background border-border"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Titre</Label>
                              <Input
                                value={module.title}
                                onChange={(e) => {
                                  const updated = [...modules];
                                  updated[index].title = e.target.value;
                                  setModules(updated);
                                }}
                                placeholder="Titre du module"
                                className="bg-background border-border"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Description</Label>
                              <Textarea
                                value={module.description}
                                onChange={(e) => {
                                  const updated = [...modules];
                                  updated[index].description = e.target.value;
                                  setModules(updated);
                                }}
                                placeholder="Description du module"
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
            Enregistrer Section Services
          </>
        )}
      </Button>
    </div>
  );
};
