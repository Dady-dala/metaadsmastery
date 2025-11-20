import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, ListPlus, Video, BookCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface CourseVideo {
  id: string;
  title: string;
  order_index: number;
}

interface Quiz {
  id: string;
  course_id: string;
  video_id: string | null;
  title: string;
  description: string | null;
  passing_score: number;
  is_required: boolean;
  questionCount?: number;
}

interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: any;
  correct_answer: string;
  points: number;
  order_index: number;
}

interface CourseQuizManagementProps {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
}

export const CourseQuizManagement = ({ courseId, courseTitle, onClose }: CourseQuizManagementProps) => {
  const [courseVideos, setCourseVideos] = useState<CourseVideo[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [selectedQuizForQuestions, setSelectedQuizForQuestions] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [quizForm, setQuizForm] = useState({
    video_id: '',
    title: '',
    description: '',
    passing_score: 70,
    is_required: false
  });

  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'short_answer',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1
  });

  useEffect(() => {
    loadData();
  }, [courseId]);

  useEffect(() => {
    if (selectedQuizForQuestions) {
      loadQuestions(selectedQuizForQuestions);
    }
  }, [selectedQuizForQuestions]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [videosResult, quizzesResult] = await Promise.all([
        supabase
          .from('course_videos')
          .select('id, title, order_index')
          .eq('course_id', courseId)
          .order('order_index'),
        supabase
          .from('quizzes')
          .select('*')
          .eq('course_id', courseId)
          .order('created_at', { ascending: false })
      ]);

      if (videosResult.data) setCourseVideos(videosResult.data);
      
      if (quizzesResult.data) {
        const quizzesWithCounts = await Promise.all(
          quizzesResult.data.map(async (quiz) => {
            const { count } = await supabase
              .from('quiz_questions')
              .select('*', { count: 'exact', head: true })
              .eq('quiz_id', quiz.id);
            return { ...quiz, questionCount: count || 0 };
          })
        );
        setQuizzes(quizzesWithCounts);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
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
      setQuestions((data || []) as Question[]);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Erreur lors du chargement des questions');
    }
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const quizData = {
        course_id: courseId,
        video_id: quizForm.video_id === '' ? null : quizForm.video_id,
        title: quizForm.title,
        description: quizForm.description,
        passing_score: quizForm.passing_score,
        is_required: quizForm.is_required
      };

      if (editingQuiz) {
        const { error } = await supabase
          .from('quizzes')
          .update(quizData)
          .eq('id', editingQuiz.id);

        if (error) throw error;
        toast.success('Quiz modifié avec succès');
      } else {
        const { error } = await supabase
          .from('quizzes')
          .insert([quizData]);

        if (error) throw error;
        toast.success('Quiz créé avec succès');
      }

      setShowQuizDialog(false);
      setEditingQuiz(null);
      setQuizForm({ video_id: '', title: '', description: '', passing_score: 70, is_required: false });
      loadData();
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast.error('Erreur lors de la sauvegarde du quiz');
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) return;

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Quiz supprimé avec succès');
      loadData();
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Erreur lors de la suppression du quiz');
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuizForQuestions) return;

    try {
      const questionData = {
        quiz_id: selectedQuizForQuestions,
        question_text: questionForm.question_text,
        question_type: questionForm.question_type,
        options: questionForm.question_type === 'multiple_choice' ? questionForm.options : null,
        correct_answer: questionForm.correct_answer,
        points: questionForm.points,
        order_index: editingQuestion ? editingQuestion.order_index : questions.length
      };

      if (editingQuestion) {
        const { error } = await supabase
          .from('quiz_questions')
          .update(questionData)
          .eq('id', editingQuestion.id);

        if (error) throw error;
        toast.success('Question modifiée avec succès');
      } else {
        const { error } = await supabase
          .from('quiz_questions')
          .insert([questionData]);

        if (error) throw error;
        toast.success('Question ajoutée avec succès');
      }

      setShowQuestionDialog(false);
      setEditingQuestion(null);
      setQuestionForm({
        question_text: '',
        question_type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: '',
        points: 1
      });
      loadQuestions(selectedQuizForQuestions);
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Erreur lors de la sauvegarde de la question');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) return;

    try {
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Question supprimée avec succès');
      if (selectedQuizForQuestions) loadQuestions(selectedQuizForQuestions);
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Erreur lors de la suppression de la question');
    }
  };

  const openEditQuizDialog = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      video_id: quiz.video_id || '',
      title: quiz.title,
      description: quiz.description || '',
      passing_score: quiz.passing_score,
      is_required: quiz.is_required
    });
    setShowQuizDialog(true);
  };

  const openCreateQuizDialog = () => {
    setEditingQuiz(null);
    setQuizForm({ video_id: '', title: '', description: '', passing_score: 70, is_required: false });
    setShowQuizDialog(true);
  };

  const openEditQuestionDialog = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options || ['', '', '', ''],
      correct_answer: question.correct_answer,
      points: question.points
    });
    setShowQuestionDialog(true);
  };

  const openCreateQuestionDialog = () => {
    setEditingQuestion(null);
    setQuestionForm({
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1
    });
    setShowQuestionDialog(true);
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
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Quiz - {courseTitle}</CardTitle>
              <CardDescription className="text-muted-foreground">
                Gérez les quiz pour ce cours et ses vidéos
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={openCreateQuizDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                Créer un quiz
              </Button>
              <Button onClick={onClose} variant="outline">
                Retour
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-foreground">Titre</TableHead>
                <TableHead className="text-foreground">Type</TableHead>
                <TableHead className="text-foreground">Questions</TableHead>
                <TableHead className="text-foreground">Score requis</TableHead>
                <TableHead className="text-foreground">Statut</TableHead>
                <TableHead className="text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quizzes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aucun quiz créé pour ce cours
                  </TableCell>
                </TableRow>
              ) : (
                quizzes.map((quiz) => {
                  const video = courseVideos.find(v => v.id === quiz.video_id);
                  return (
                    <TableRow key={quiz.id}>
                      <TableCell className="text-foreground font-medium">{quiz.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {quiz.video_id ? (
                            <>
                              <Video className="w-4 h-4" />
                              <span>Leçon {video ? video.order_index + 1 : '?'}</span>
                            </>
                          ) : (
                            <>
                              <BookCheck className="w-4 h-4" />
                              <span>Cours entier</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{quiz.questionCount || 0}</TableCell>
                      <TableCell className="text-muted-foreground">{quiz.passing_score}%</TableCell>
                      <TableCell>
                        {quiz.is_required ? (
                          <Badge variant="destructive">Obligatoire</Badge>
                        ) : (
                          <Badge variant="secondary">Optionnel</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedQuizForQuestions(quiz.id);
                              loadQuestions(quiz.id);
                            }}
                          >
                            <ListPlus className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditQuizDialog(quiz)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteQuiz(quiz.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section Questions */}
      {selectedQuizForQuestions && (
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">
                Questions - {quizzes.find(q => q.id === selectedQuizForQuestions)?.title}
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={openCreateQuestionDialog} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Ajouter une question
                </Button>
                <Button onClick={() => setSelectedQuizForQuestions(null)} size="sm" variant="outline">
                  Fermer
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-foreground">Question</TableHead>
                  <TableHead className="text-foreground">Type</TableHead>
                  <TableHead className="text-foreground">Points</TableHead>
                  <TableHead className="text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Aucune question ajoutée
                    </TableCell>
                  </TableRow>
                ) : (
                  questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="text-foreground">{question.question_text}</TableCell>
                      <TableCell className="text-muted-foreground">{question.question_type}</TableCell>
                      <TableCell className="text-muted-foreground">{question.points}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditQuestionDialog(question)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteQuestion(question.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog Création/Édition Quiz */}
      <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingQuiz ? 'Modifier le quiz' : 'Nouveau quiz'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configurez les informations du quiz
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitQuiz} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quiz_type" className="text-foreground">Type de quiz</Label>
              <Select
                value={quizForm.video_id}
                onValueChange={(value) => setQuizForm({ ...quizForm, video_id: value })}
              >
                <SelectTrigger className="bg-background text-foreground border-border">
                  <SelectValue placeholder="Sélectionnez le type de quiz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Quiz général du cours</SelectItem>
                  {courseVideos.map((video) => (
                    <SelectItem key={video.id} value={video.id}>
                      Quiz pour la leçon {video.order_index + 1}: {video.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title" className="text-foreground">Titre du quiz</Label>
              <Input
                id="title"
                value={quizForm.title}
                onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                placeholder="Ex: Quiz Module 1"
                required
                className="bg-background text-foreground border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">Description</Label>
              <Textarea
                id="description"
                value={quizForm.description}
                onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                placeholder="Description du quiz"
                className="bg-background text-foreground border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passing_score" className="text-foreground">Score de réussite (%)</Label>
              <Input
                id="passing_score"
                type="number"
                min="0"
                max="100"
                value={quizForm.passing_score}
                onChange={(e) => setQuizForm({ ...quizForm, passing_score: parseInt(e.target.value) })}
                className="bg-background text-foreground border-border"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_required"
                checked={quizForm.is_required}
                onChange={(e) => setQuizForm({ ...quizForm, is_required: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="is_required" className="text-foreground cursor-pointer">
                Quiz obligatoire pour progresser
              </Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowQuizDialog(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingQuiz ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Création/Édition Question */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingQuestion ? 'Modifier la question' : 'Nouvelle question'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configurez les détails de la question
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitQuestion} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question_text" className="text-foreground">Question</Label>
              <Textarea
                id="question_text"
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                placeholder="Entrez votre question"
                required
                className="bg-background text-foreground border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="question_type" className="text-foreground">Type de question</Label>
              <Select
                value={questionForm.question_type}
                onValueChange={(value: any) => setQuestionForm({ ...questionForm, question_type: value })}
              >
                <SelectTrigger className="bg-background text-foreground border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Choix multiple</SelectItem>
                  <SelectItem value="true_false">Vrai/Faux</SelectItem>
                  <SelectItem value="short_answer">Réponse courte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {questionForm.question_type === 'multiple_choice' && (
              <div className="space-y-2">
                <Label className="text-foreground">Options de réponse</Label>
                {questionForm.options.map((option, index) => (
                  <Input
                    key={index}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...questionForm.options];
                      newOptions[index] = e.target.value;
                      setQuestionForm({ ...questionForm, options: newOptions });
                    }}
                    placeholder={`Option ${index + 1}`}
                    className="bg-background text-foreground border-border"
                  />
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="correct_answer" className="text-foreground">Réponse correcte</Label>
              <Input
                id="correct_answer"
                value={questionForm.correct_answer}
                onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                placeholder="Réponse correcte"
                required
                className="bg-background text-foreground border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="points" className="text-foreground">Points</Label>
              <Input
                id="points"
                type="number"
                min="1"
                value={questionForm.points}
                onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) })}
                className="bg-background text-foreground border-border"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowQuestionDialog(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingQuestion ? 'Modifier' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
