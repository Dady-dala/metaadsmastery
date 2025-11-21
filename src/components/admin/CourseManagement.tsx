import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { BookOpen, Plus, Trash2, Edit2, Video, ClipboardList, ChevronDown, ChevronUp, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  course_id: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  course_id: string;
  video_id: string | null;
  passing_score: number;
  is_required: boolean;
}

interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: string;
  options: any;
  correct_answer: string;
  points: number;
  order_index: number;
}

export const CourseManagement = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', is_certifying: true });
  const [videoCount, setVideoCount] = useState<Record<string, number>>({});
  
  // Quiz management states
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [courseVideos, setCourseVideos] = useState<CourseVideo[]>([]);
  const [courseQuizzes, setCourseQuizzes] = useState<Quiz[]>([]);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [creatingQuizForVideo, setCreatingQuizForVideo] = useState<string | null>(null);
  const [creatingGeneralQuiz, setCreatingGeneralQuiz] = useState(false);
  const [quizFormData, setQuizFormData] = useState({
    title: '',
    description: '',
    passing_score: 70,
    is_required: false
  });

  // Question management
  const [selectedQuizForQuestions, setSelectedQuizForQuestions] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [questionFormData, setQuestionFormData] = useState({
    question_text: '',
    question_type: 'multiple_choice' as string,
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1
  });

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

  const loadCourseQuizData = async (courseId: string) => {
    try {
      const [videosData, quizzesData] = await Promise.all([
        supabase.from('course_videos').select('*').eq('course_id', courseId).order('order_index'),
        supabase.from('quizzes').select('*').eq('course_id', courseId)
      ]);

      if (videosData.error) throw videosData.error;
      if (quizzesData.error) throw quizzesData.error;

      setCourseVideos(videosData.data || []);
      setCourseQuizzes(quizzesData.data || []);
    } catch (error) {
      console.error('Error loading course quiz data:', error);
      toast.error('Erreur lors du chargement des données du cours');
    }
  };

  const loadQuestions = async (quizId: string) => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index');

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Erreur lors du chargement des questions');
    }
  };

  const handleExpandCourse = async (courseId: string) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
      setCourseVideos([]);
      setCourseQuizzes([]);
    } else {
      setExpandedCourse(courseId);
      await loadCourseQuizData(courseId);
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

  const startCreatingQuiz = (videoId: string | null) => {
    setQuizFormData({ title: '', description: '', passing_score: 70, is_required: false });
    setEditingQuiz(null);
    if (videoId) {
      setCreatingQuizForVideo(videoId);
      setCreatingGeneralQuiz(false);
    } else {
      setCreatingGeneralQuiz(true);
      setCreatingQuizForVideo(null);
    }
  };

  const startEditingQuiz = (quiz: Quiz) => {
    setQuizFormData({
      title: quiz.title,
      description: quiz.description || '',
      passing_score: quiz.passing_score,
      is_required: quiz.is_required
    });
    setEditingQuiz(quiz);
    if (quiz.video_id) {
      setCreatingQuizForVideo(quiz.video_id);
      setCreatingGeneralQuiz(false);
    } else {
      setCreatingGeneralQuiz(true);
      setCreatingQuizForVideo(null);
    }
  };

  const cancelQuizEdit = () => {
    setEditingQuiz(null);
    setCreatingQuizForVideo(null);
    setCreatingGeneralQuiz(false);
    setQuizFormData({ title: '', description: '', passing_score: 70, is_required: false });
  };

  const saveQuiz = async () => {
    if (!expandedCourse) return;
    if (!quizFormData.title.trim()) {
      toast.error('Le titre du quiz est obligatoire');
      return;
    }

    try {
      const quizData = {
        ...quizFormData,
        course_id: expandedCourse,
        video_id: creatingQuizForVideo || null
      };

      if (editingQuiz) {
        const { error } = await supabase
          .from('quizzes')
          .update(quizData)
          .eq('id', editingQuiz.id);
        
        if (error) throw error;
        toast.success('Quiz mis à jour avec succès');
      } else {
        const { error } = await supabase
          .from('quizzes')
          .insert([quizData]);
        
        if (error) throw error;
        toast.success('Quiz créé avec succès');
      }

      await loadCourseQuizData(expandedCourse);
      cancelQuizEdit();
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast.error('Erreur lors de l\'enregistrement du quiz');
    }
  };

  const deleteQuiz = async (quizId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce quiz et toutes ses questions ?')) return;

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);
      
      if (error) throw error;
      toast.success('Quiz supprimé avec succès');
      
      if (expandedCourse) {
        await loadCourseQuizData(expandedCourse);
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Erreur lors de la suppression du quiz');
    }
  };

  const openQuestionsPanel = async (quizId: string) => {
    setSelectedQuizForQuestions(quizId);
    await loadQuestions(quizId);
  };

  const closeQuestionsPanel = () => {
    setSelectedQuizForQuestions(null);
    setQuestions([]);
    setEditingQuestion(null);
    setCreatingQuestion(false);
  };

  const startCreatingQuestion = () => {
    setQuestionFormData({
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1
    });
    setEditingQuestion(null);
    setCreatingQuestion(true);
  };

  const startEditingQuestion = (question: Question) => {
    setQuestionFormData({
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options || ['', '', '', ''],
      correct_answer: question.correct_answer,
      points: question.points
    });
    setEditingQuestion(question);
    setCreatingQuestion(false);
  };

  const cancelQuestionEdit = () => {
    setEditingQuestion(null);
    setCreatingQuestion(false);
    setQuestionFormData({
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1
    });
  };

  const saveQuestion = async () => {
    if (!selectedQuizForQuestions) return;
    if (!questionFormData.question_text.trim()) {
      toast.error('La question est obligatoire');
      return;
    }
    if (!questionFormData.correct_answer.trim()) {
      toast.error('La réponse correcte est obligatoire');
      return;
    }

    try {
      const questionData = {
        ...questionFormData,
        quiz_id: selectedQuizForQuestions,
        order_index: editingQuestion ? editingQuestion.order_index : questions.length
      };

      if (editingQuestion) {
        const { error } = await supabase
          .from('quiz_questions')
          .update(questionData)
          .eq('id', editingQuestion.id);
        
        if (error) throw error;
        toast.success('Question mise à jour avec succès');
      } else {
        const { error } = await supabase
          .from('quiz_questions')
          .insert([questionData]);
        
        if (error) throw error;
        toast.success('Question créée avec succès');
      }

      await loadQuestions(selectedQuizForQuestions);
      cancelQuestionEdit();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Erreur lors de l\'enregistrement de la question');
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) return;

    try {
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', questionId);
      
      if (error) throw error;
      toast.success('Question supprimée avec succès');
      
      if (selectedQuizForQuestions) {
        await loadQuestions(selectedQuizForQuestions);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Erreur lors de la suppression de la question');
    }
  };

  const getQuizForVideo = (videoId: string) => {
    return courseQuizzes.find(q => q.video_id === videoId);
  };

  const getGeneralQuiz = () => {
    return courseQuizzes.find(q => q.video_id === null);
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

  return (
    <Card className="bg-card border-border">
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-base md:text-lg text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
              Gestion des Formations
            </CardTitle>
            <CardDescription className="text-xs md:text-sm text-muted-foreground">
              Créez et gérez vos formations et leurs quiz
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
                className="bg-muted/50 border border-border rounded-lg overflow-hidden"
              >
                <div className="p-4">
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
                        onClick={() => handleExpandCourse(course.id)}
                        className="border-border"
                        title="Gérer les quiz"
                      >
                        <ClipboardList className="w-4 h-4 mr-1" />
                        {expandedCourse === course.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
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

                {/* Quiz Management Panel */}
                {expandedCourse === course.id && (
                  <div className="border-t border-border bg-muted/30 p-4">
                    <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      Gestion des Quiz
                    </h4>

                    {/* Quiz général du cours */}
                    <div className="mb-6 bg-background/50 border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-foreground">📝 Quiz général du cours</h5>
                        {!getGeneralQuiz() && !creatingGeneralQuiz && (
                          <Button size="sm" onClick={() => startCreatingQuiz(null)} className="bg-primary text-primary-foreground">
                            <Plus className="w-3 h-3 mr-1" /> Créer
                          </Button>
                        )}
                      </div>

                      {getGeneralQuiz() && !creatingGeneralQuiz ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">{getGeneralQuiz()!.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Seuil: {getGeneralQuiz()!.passing_score}% 
                                {getGeneralQuiz()!.is_required && ' • Obligatoire'}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => openQuestionsPanel(getGeneralQuiz()!.id)}>
                                Questions
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => startEditingQuiz(getGeneralQuiz()!)}>
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteQuiz(getGeneralQuiz()!.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : creatingGeneralQuiz || (editingQuiz && editingQuiz.video_id === null) ? (
                        <div className="space-y-3 mt-3">
                          <div>
                            <Label className="text-sm">Titre du quiz</Label>
                            <Input
                              value={quizFormData.title}
                              onChange={(e) => setQuizFormData({ ...quizFormData, title: e.target.value })}
                              placeholder="Ex: Quiz final du cours"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Description (optionnel)</Label>
                            <Textarea
                              value={quizFormData.description}
                              onChange={(e) => setQuizFormData({ ...quizFormData, description: e.target.value })}
                              placeholder="Description du quiz"
                              rows={2}
                              className="text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm">Score de passage (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={quizFormData.passing_score}
                                onChange={(e) => setQuizFormData({ ...quizFormData, passing_score: parseInt(e.target.value) })}
                                className="text-sm"
                              />
                            </div>
                            <div className="flex items-end">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={quizFormData.is_required}
                                  onChange={(e) => setQuizFormData({ ...quizFormData, is_required: e.target.checked })}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm">Quiz obligatoire</span>
                              </label>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveQuiz} className="bg-primary text-primary-foreground">
                              <Save className="w-3 h-3 mr-1" /> Enregistrer
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelQuizEdit}>
                              <X className="w-3 h-3 mr-1" /> Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Aucun quiz général créé</p>
                      )}
                    </div>

                    {/* Quiz par vidéo */}
                    <div className="space-y-2">
                      <h5 className="font-medium text-foreground mb-2">🎬 Quiz par vidéo</h5>
                      {courseVideos.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Aucune vidéo dans ce cours</p>
                      ) : (
                        courseVideos.map((video) => {
                          const videoQuiz = getQuizForVideo(video.id);
                          const isEditing = (creatingQuizForVideo === video.id) || (editingQuiz && editingQuiz.video_id === video.id);

                          return (
                            <div key={video.id} className="bg-background/50 border border-border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h6 className="text-sm font-medium text-foreground">{video.title}</h6>
                                {!videoQuiz && !isEditing && (
                                  <Button size="sm" onClick={() => startCreatingQuiz(video.id)} className="bg-primary text-primary-foreground">
                                    <Plus className="w-3 h-3 mr-1" /> Créer quiz
                                  </Button>
                                )}
                              </div>

                              {videoQuiz && !isEditing ? (
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{videoQuiz.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Seuil: {videoQuiz.passing_score}%
                                      {videoQuiz.is_required && ' • Obligatoire'}
                                    </p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="outline" onClick={() => openQuestionsPanel(videoQuiz.id)}>
                                      Questions
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => startEditingQuiz(videoQuiz)}>
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => deleteQuiz(videoQuiz.id)}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : isEditing ? (
                                <div className="space-y-3 mt-2">
                                  <div>
                                    <Label className="text-sm">Titre du quiz</Label>
                                    <Input
                                      value={quizFormData.title}
                                      onChange={(e) => setQuizFormData({ ...quizFormData, title: e.target.value })}
                                      placeholder="Ex: Quiz sur cette leçon"
                                      className="text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm">Description (optionnel)</Label>
                                    <Textarea
                                      value={quizFormData.description}
                                      onChange={(e) => setQuizFormData({ ...quizFormData, description: e.target.value })}
                                      placeholder="Description du quiz"
                                      rows={2}
                                      className="text-sm"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label className="text-sm">Score de passage (%)</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={quizFormData.passing_score}
                                        onChange={(e) => setQuizFormData({ ...quizFormData, passing_score: parseInt(e.target.value) })}
                                        className="text-sm"
                                      />
                                    </div>
                                    <div className="flex items-end">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={quizFormData.is_required}
                                          onChange={(e) => setQuizFormData({ ...quizFormData, is_required: e.target.checked })}
                                          className="w-4 h-4"
                                        />
                                        <span className="text-sm">Quiz obligatoire</span>
                                      </label>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={saveQuiz} className="bg-primary text-primary-foreground">
                                      <Save className="w-3 h-3 mr-1" /> Enregistrer
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={cancelQuizEdit}>
                                      <X className="w-3 h-3 mr-1" /> Annuler
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">Aucun quiz pour cette vidéo</p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Questions Management Panel (Modal) */}
        {selectedQuizForQuestions && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border-border rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Gestion des Questions</h3>
                <div className="flex gap-2">
                  {!creatingQuestion && !editingQuestion && (
                    <Button size="sm" onClick={startCreatingQuestion} className="bg-primary text-primary-foreground">
                      <Plus className="w-3 h-3 mr-1" /> Nouvelle question
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={closeQuestionsPanel}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Question Form */}
                {(creatingQuestion || editingQuestion) && (
                  <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-foreground">
                      {editingQuestion ? 'Modifier la question' : 'Nouvelle question'}
                    </h4>
                    <div>
                      <Label>Question</Label>
                      <Textarea
                        value={questionFormData.question_text}
                        onChange={(e) => setQuestionFormData({ ...questionFormData, question_text: e.target.value })}
                        placeholder="Entrez votre question"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Type de question</Label>
                        <Select
                          value={questionFormData.question_type}
                          onValueChange={(value) => setQuestionFormData({ ...questionFormData, question_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple_choice">Choix multiple</SelectItem>
                            <SelectItem value="true_false">Vrai/Faux</SelectItem>
                            <SelectItem value="short_answer">Réponse courte</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Points</Label>
                        <Input
                          type="number"
                          min="1"
                          value={questionFormData.points}
                          onChange={(e) => setQuestionFormData({ ...questionFormData, points: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>

                    {questionFormData.question_type === 'multiple_choice' && (
                      <div>
                        <Label>Options (une par ligne)</Label>
                        {questionFormData.options.map((option: string, idx: number) => (
                          <Input
                            key={idx}
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...questionFormData.options];
                              newOptions[idx] = e.target.value;
                              setQuestionFormData({ ...questionFormData, options: newOptions });
                            }}
                            placeholder={`Option ${idx + 1}`}
                            className="mb-2"
                          />
                        ))}
                      </div>
                    )}

                    <div>
                      <Label>Réponse correcte</Label>
                      <Input
                        value={questionFormData.correct_answer}
                        onChange={(e) => setQuestionFormData({ ...questionFormData, correct_answer: e.target.value })}
                        placeholder="Entrez la réponse correcte"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveQuestion} className="bg-primary text-primary-foreground">
                        <Save className="w-3 h-3 mr-1" /> Enregistrer
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelQuestionEdit}>
                        <X className="w-3 h-3 mr-1" /> Annuler
                      </Button>
                    </div>
                  </div>
                )}

                {/* Questions List */}
                <div>
                  <h4 className="font-medium text-foreground mb-2">Questions du quiz ({questions.length})</h4>
                  {questions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune question créée pour ce quiz</p>
                  ) : (
                    <div className="space-y-2">
                      {questions.map((question, idx) => (
                        <div key={question.id} className="bg-background border border-border rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground mb-1">
                                {idx + 1}. {question.question_text}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Type: {question.question_type} • Points: {question.points}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => startEditingQuestion(question)}>
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteQuestion(question.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};