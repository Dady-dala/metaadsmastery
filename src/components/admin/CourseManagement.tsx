import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { BookOpen, Plus, Trash2, Edit2, Video, ClipboardList } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { CourseQuizManagement } from './CourseQuizManagement';

interface Course {
  id: string;
  title: string;
  description: string;
  is_certifying: boolean;
  created_at: string;
}

interface CourseVideo {
  id: string;
  title: string;
  order_index: number;
}

export const CourseManagement = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', is_certifying: true });
  const [videoCount, setVideoCount] = useState<Record<string, number>>({});
  const [selectedCourseForQuiz, setSelectedCourseForQuiz] = useState<Course | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setCourses(data);
        // Load video counts for each course
        const counts: Record<string, number> = {};
        for (const course of data) {
          const { count } = await supabase
            .from('course_videos')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);
          counts[course.id] = count || 0;
        }
        setVideoCount(counts);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Erreur lors du chargement des cours');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update(formData)
          .eq('id', editingCourse.id);
        
        if (error) throw error;
        toast.success('Cours mis à jour avec succès');
      } else {
        const { error } = await supabase
          .from('courses')
          .insert([formData]);
        
        if (error) throw error;
        toast.success('Cours créé avec succès');
      }
      
      setDialogOpen(false);
      setFormData({ title: '', description: '', is_certifying: true });
      setEditingCourse(null);
      loadCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) return;
    
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Cours supprimé avec succès');
      loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setFormData({ title: course.title, description: course.description || '', is_certifying: course.is_certifying });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingCourse(null);
    setFormData({ title: '', description: '', is_certifying: true });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (selectedCourseForQuiz) {
    return (
      <CourseQuizManagement
        courseId={selectedCourseForQuiz.id}
        courseTitle={selectedCourseForQuiz.title}
        onClose={() => setSelectedCourseForQuiz(null)}
      />
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Gestion des Formations
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Créez et gérez vos formations
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Formation
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingCourse ? 'Modifier la formation' : 'Nouvelle formation'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {editingCourse ? 'Modifiez les détails de la formation' : 'Créez une nouvelle formation'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-foreground">Titre</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-foreground">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_certifying"
                    checked={formData.is_certifying}
                    onChange={(e) => setFormData({ ...formData, is_certifying: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_certifying" className="text-foreground cursor-pointer">
                    Ce cours délivre un certificat
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {editingCourse ? 'Mettre à jour' : 'Créer'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Aucune formation créée pour le moment
          </p>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-muted/50 border border-border rounded-lg p-4 hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{course.title}</h3>
                    {course.description && (
                      <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        <span>{videoCount[course.id] || 0} vidéos</span>
                      </div>
                      {course.is_certifying && (
                        <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                          🏆 Certifiant
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCourseForQuiz(course)}
                      className="border-border"
                      title="Gérer les quiz"
                    >
                      <ClipboardList className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(course)}
                      className="border-border"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(course.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
