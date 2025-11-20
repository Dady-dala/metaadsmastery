import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle2, Clock, Trophy, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface CourseProgressData {
  courseId: string;
  courseTitle: string;
  totalVideos: number;
  completedVideos: number;
  progressPercentage: number;
  totalQuizzes: number;
  completedQuizzes: number;
  averageQuizScore: number;
  hasCertificate: boolean;
  lastActivity: string | null;
}

export const EnhancedCourseProgress = () => {
  const [progressData, setProgressData] = useState<CourseProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalVideosWatched: 0,
    totalQuizzesPassed: 0,
    averageScore: 0
  });

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select('course_id')
        .eq('student_id', session.user.id);

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      const courseIds = enrollments.map(e => e.course_id);

      const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', courseIds);

      if (!courses) {
        setLoading(false);
        return;
      }

      const progressPromises = courses.map(async (course) => {
        const { data: videos } = await supabase
          .from('course_videos')
          .select('id')
          .eq('course_id', course.id);

        const totalVideos = videos?.length || 0;

        const { data: completedVideos } = await supabase
          .from('video_progress')
          .select('id, last_watched_at')
          .eq('student_id', session.user.id)
          .in('video_id', videos?.map(v => v.id) || [])
          .eq('completed', true);

        const completed = completedVideos?.length || 0;
        const progressPercentage = totalVideos > 0 ? Math.round((completed / totalVideos) * 100) : 0;

        const { data: quizzes } = await supabase
          .from('quizzes')
          .select('id')
          .eq('course_id', course.id);

        const totalQuizzes = quizzes?.length || 0;

        const { data: quizAttempts } = await supabase
          .from('quiz_attempts')
          .select('score, passed')
          .eq('student_id', session.user.id)
          .in('quiz_id', quizzes?.map(q => q.id) || []);

        const passedQuizzes = quizAttempts?.filter(a => a.passed).length || 0;
        const avgScore = quizAttempts && quizAttempts.length > 0
          ? Math.round(quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length)
          : 0;

        const { data: certificate } = await supabase
          .from('certificates')
          .select('id')
          .eq('student_id', session.user.id)
          .eq('course_id', course.id)
          .single();

        const lastActivity = completedVideos && completedVideos.length > 0
          ? completedVideos.sort((a, b) => 
              new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime()
            )[0].last_watched_at
          : null;

        return {
          courseId: course.id,
          courseTitle: course.title,
          totalVideos,
          completedVideos: completed,
          progressPercentage,
          totalQuizzes,
          completedQuizzes: passedQuizzes,
          averageQuizScore: avgScore,
          hasCertificate: !!certificate,
          lastActivity
        };
      });

      const progress = await Promise.all(progressPromises);
      setProgressData(progress);

      const stats = {
        totalCourses: progress.length,
        completedCourses: progress.filter(p => p.progressPercentage === 100).length,
        totalVideosWatched: progress.reduce((sum, p) => sum + p.completedVideos, 0),
        totalQuizzesPassed: progress.reduce((sum, p) => sum + p.completedQuizzes, 0),
        averageScore: progress.length > 0
          ? Math.round(progress.reduce((sum, p) => sum + p.averageQuizScore, 0) / progress.length)
          : 0
      };
      setTotalStats(stats);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Chargement de la progression...</p>
        </CardContent>
      </Card>
    );
  }

  if (progressData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Aucune progression à afficher</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = progressData.map(p => ({
    name: p.courseTitle.substring(0, 20),
    progression: p.progressPercentage,
    score: p.averageQuizScore
  }));

  const pieData = [
    { name: 'Complétés', value: totalStats.completedCourses },
    { name: 'En cours', value: totalStats.totalCourses - totalStats.completedCourses }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cours complétés</p>
                <p className="text-3xl font-bold text-foreground">
                  {totalStats.completedCourses}/{totalStats.totalCourses}
                </p>
              </div>
              <Trophy className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vidéos regardées</p>
                <p className="text-3xl font-bold text-foreground">{totalStats.totalVideosWatched}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quiz réussis</p>
                <p className="text-3xl font-bold text-foreground">{totalStats.totalQuizzesPassed}</p>
              </div>
              <Award className="w-10 h-10 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score moyen</p>
                <p className="text-3xl font-bold text-foreground">{totalStats.averageScore}%</p>
              </div>
              <BookOpen className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Progression par cours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="progression" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Répartition des cours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {progressData.map((progress) => (
          <Card key={progress.courseId} className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  {progress.courseTitle}
                </CardTitle>
                {progress.hasCertificate && (
                  <Badge variant="secondary" className="gap-1">
                    <Trophy className="w-3 h-3" />
                    Certificat obtenu
                  </Badge>
                )}
              </div>
              <CardDescription className="text-muted-foreground">
                Dernière activité: {progress.lastActivity 
                  ? new Date(progress.lastActivity).toLocaleDateString('fr-FR')
                  : 'Jamais'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progression vidéos</span>
                  <span className="text-foreground font-semibold">{progress.progressPercentage}%</span>
                </div>
                <Progress value={progress.progressPercentage} className="h-3" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-foreground">
                    <span className="font-semibold">{progress.completedVideos}</span>
                    <span className="text-muted-foreground"> / {progress.totalVideos} vidéos</span>
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">
                    {progress.totalVideos - progress.completedVideos} restantes
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-accent" />
                  <span className="text-foreground">
                    <span className="font-semibold">{progress.completedQuizzes}</span>
                    <span className="text-muted-foreground"> / {progress.totalQuizzes} quiz</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="text-foreground">
                    Score: <span className="font-semibold">{progress.averageQuizScore}%</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};