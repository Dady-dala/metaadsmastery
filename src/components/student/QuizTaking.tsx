import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Trophy, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateCertificate } from '@/utils/certificateGenerator';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  passing_score: number;
  course_id: string;
  video_id: string | null;
  is_required: boolean;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  order_index: number;
  points: number;
}

interface QuizAttempt {
  score: number;
  passed: boolean;
  completed_at: string;
}

export const QuizTaking = ({ courseId, videoId }: { courseId: string; videoId?: string }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizAttempts, setQuizAttempts] = useState<Record<string, QuizAttempt>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadQuizzes();
  }, [courseId, videoId]);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let query = supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId);

      if (videoId) {
        query = query.eq('video_id', videoId);
      } else {
        query = query.is('video_id', null);
      }

      const { data: quizzesData } = await query.order('created_at');

      if (quizzesData) {
        setQuizzes(quizzesData);

        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('quiz_id, score, passed, completed_at')
          .eq('student_id', session.user.id)
          .in('quiz_id', quizzesData.map(q => q.id));

        if (attempts) {
          const attemptsMap: Record<string, QuizAttempt> = {};
          attempts.forEach(attempt => {
            attemptsMap[attempt.quiz_id] = {
              score: attempt.score,
              passed: attempt.passed,
              completed_at: attempt.completed_at
            };
          });
          setQuizAttempts(attemptsMap);
        }
      }
    } catch (error) {
      console.error('Error loading quizzes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les quiz",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQuestionIndex(0);
    setAnswers({});

    const { data: questionsData } = await supabase
      .from('quiz_questions')
      .select('id, question_text, question_type, options, order_index, points')
      .eq('quiz_id', quiz.id)
      .order('order_index');

    if (questionsData) {
      const formattedQuestions: Question[] = questionsData.map(q => ({
        ...q,
        options: q.options ? (q.options as string[]) : null
      }));
      setQuestions(formattedQuestions);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitQuiz = async () => {
    if (!selectedQuiz) return;

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: questionsWithAnswers } = await supabase
        .from('quiz_questions')
        .select('id, correct_answer, points')
        .eq('quiz_id', selectedQuiz.id);

      if (!questionsWithAnswers) return;

      let totalPoints = 0;
      let earnedPoints = 0;

      questionsWithAnswers.forEach(question => {
        totalPoints += question.points;
        if (answers[question.id] === question.correct_answer) {
          earnedPoints += question.points;
        }
      });

      const score = Math.round((earnedPoints / totalPoints) * 100);
      const passed = score >= selectedQuiz.passing_score;

      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          student_id: session.user.id,
          quiz_id: selectedQuiz.id,
          score,
          passed,
          answers
        });

      if (error) throw error;

      toast({
        title: passed ? "Félicitations !" : "Quiz terminé",
        description: passed 
          ? `Vous avez réussi avec ${score}% !` 
          : `Vous avez obtenu ${score}%. Score requis: ${selectedQuiz.passing_score}%`,
        variant: passed ? "default" : "destructive"
      });

      setQuizAttempts(prev => ({
        ...prev,
        [selectedQuiz.id]: { score, passed, completed_at: new Date().toISOString() }
      }));

      // Vérifier si le cours est terminé à 100% et générer le certificat
      await checkCourseCompletion(courseId, session.user.id);

      setSelectedQuiz(null);
      setQuestions([]);
      setAnswers({});
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Erreur",
        description: "Impossible de soumettre le quiz",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const checkCourseCompletion = async (courseId: string, studentId: string) => {
    // Vérifier si l'étudiant a terminé toutes les vidéos
    const { data: videos } = await supabase
      .from('course_videos')
      .select('id')
      .eq('course_id', courseId);

    if (!videos || videos.length === 0) return;

    const { data: completedVideos } = await supabase
      .from('video_progress')
      .select('id')
      .eq('student_id', studentId)
      .in('video_id', videos.map(v => v.id))
      .eq('completed', true);

    const allVideosCompleted = completedVideos && completedVideos.length === videos.length;

    // Vérifier si l'étudiant a réussi tous les quiz
    const { data: courseQuizzes } = await supabase
      .from('quizzes')
      .select('id')
      .eq('course_id', courseId);

    if (!courseQuizzes || courseQuizzes.length === 0) return;

    const { data: passedQuizzes } = await supabase
      .from('quiz_attempts')
      .select('quiz_id')
      .eq('student_id', studentId)
      .in('quiz_id', courseQuizzes.map(q => q.id))
      .eq('passed', true);

    const allQuizzesPassed = passedQuizzes && passedQuizzes.length === courseQuizzes.length;

    // Si tout est terminé, générer le certificat
    if (allVideosCompleted && allQuizzesPassed) {
      // Vérifier si un certificat n'existe pas déjà
      const { data: existingCert } = await supabase
        .from('certificates')
        .select('id')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (!existingCert) {
        // Récupérer les infos du cours et de l'étudiant
        const { data: course } = await supabase
          .from('courses')
          .select('title, is_certifying')
          .eq('id', courseId)
          .single();
        
        // Vérifier si le cours est certifiant
        if (!course || !course.is_certifying) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', studentId)
          .single();

        if (course && profile) {
          const certificateUrl = await generateCertificate({
            studentName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            courseName: course.title,
            completionDate: new Date().toLocaleDateString('fr-FR')
          });

          await supabase
            .from('certificates')
            .insert({
              student_id: studentId,
              course_id: courseId,
              certificate_url: certificateUrl
            });

          toast({
            title: "🎉 Certificat généré !",
            description: "Félicitations ! Vous avez terminé le cours à 100%",
          });
        }
      }
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Chargement des quiz...</p>
        </CardContent>
      </Card>
    );
  }

  if (selectedQuiz && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">{selectedQuiz.title}</CardTitle>
            <Badge variant="secondary">
              Question {currentQuestionIndex + 1} / {questions.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {currentQuestion.question_text}
            </h3>
            
            {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="text-foreground cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>

          <div className="flex justify-between gap-4">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Précédent
            </Button>
            
            {currentQuestionIndex < questions.length - 1 ? (
              <Button onClick={nextQuestion}>
                Suivant
              </Button>
            ) : (
              <Button 
                onClick={submitQuiz} 
                disabled={submitting || Object.keys(answers).length !== questions.length}
              >
                {submitting ? "Soumission..." : "Terminer le quiz"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {quizzes.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-muted-foreground">Aucun quiz disponible pour ce cours</p>
          </CardContent>
        </Card>
      ) : (
        quizzes.map((quiz) => {
          const attempt = quizAttempts[quiz.id];
          return (
            <Card key={quiz.id} className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-foreground flex items-center gap-2">
                      {quiz.title}
                      {quiz.is_required && (
                        <Badge variant="destructive" className="gap-1">
                          Obligatoire
                        </Badge>
                      )}
                      {attempt?.passed && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Réussi
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground mt-1">
                      {quiz.description || "Testez vos connaissances"}
                    </CardDescription>
                  </div>
                  {attempt && (
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {attempt.passed ? (
                          <Trophy className="w-5 h-5 text-primary" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                        <span className="text-2xl font-bold text-foreground">
                          {attempt.score}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(attempt.completed_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Score requis: {quiz.passing_score}%</span>
                  </div>
                  <Button onClick={() => startQuiz(quiz)}>
                    {attempt ? "Repasser le quiz" : "Commencer"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};
