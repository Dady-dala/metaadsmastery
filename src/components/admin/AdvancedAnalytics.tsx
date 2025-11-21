import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap, TrendingUp, Award, BookOpen, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface CourseAnalytics {
  courseId: string;
  courseTitle: string;
  totalStudents: number;
  activeStudents: number;
  averageProgress: number;
  completionRate: number;
  averageQuizScore: number;
  dropoffRate: number;
}

interface VideoAnalytics {
  videoTitle: string;
  completionRate: number;
  averageWatchTime: number;
  dropoffPoint: number;
}

export const AdvancedAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics[]>([]);
  const [globalStats, setGlobalStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalCertificates: 0,
    averageCompletionRate: 0,
    totalQuizAttempts: 0,
    averageQuizScore: 0
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title');

      if (!courses) {
        setLoading(false);
        return;
      }

      const analyticsPromises = courses.map(async (course) => {
        const { data: enrollments } = await supabase
          .from('student_enrollments')
          .select('student_id')
          .eq('course_id', course.id);

        const totalStudents = enrollments?.length || 0;

        const { data: videos } = await supabase
          .from('course_videos')
          .select('id')
          .eq('course_id', course.id);

        const totalVideos = videos?.length || 0;

        if (totalVideos === 0 || totalStudents === 0) {
          return {
            courseId: course.id,
            courseTitle: course.title,
            totalStudents,
            activeStudents: 0,
            averageProgress: 0,
            completionRate: 0,
            averageQuizScore: 0,
            dropoffRate: 0
          };
        }

        let activeCount = 0;
        let totalProgress = 0;
        let completedCount = 0;

        for (const enrollment of enrollments || []) {
          const { data: progress } = await supabase
            .from('video_progress')
            .select('completed, last_watched_at')
            .eq('student_id', enrollment.student_id)
            .in('video_id', videos?.map(v => v.id) || []);

          const completed = progress?.filter(p => p.completed).length || 0;
          const progressPercent = (completed / totalVideos) * 100;
          totalProgress += progressPercent;

          if (progressPercent === 100) completedCount++;

          const lastActivity = progress && progress.length > 0
            ? new Date(Math.max(...progress.map(p => new Date(p.last_watched_at).getTime())))
            : null;

          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          if (lastActivity && lastActivity > sevenDaysAgo) {
            activeCount++;
          }
        }

        const averageProgress = totalStudents > 0 ? totalProgress / totalStudents : 0;
        const completionRate = totalStudents > 0 ? (completedCount / totalStudents) * 100 : 0;
        const dropoffRate = 100 - completionRate;

        const { data: quizzes } = await supabase
          .from('quizzes')
          .select('id')
          .eq('course_id', course.id);

        let avgQuizScore = 0;
        if (quizzes && quizzes.length > 0) {
          const { data: attempts } = await supabase
            .from('quiz_attempts')
            .select('score')
            .in('quiz_id', quizzes.map(q => q.id));

          if (attempts && attempts.length > 0) {
            avgQuizScore = Math.round(
              attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
            );
          }
        }

        return {
          courseId: course.id,
          courseTitle: course.title,
          totalStudents,
          activeStudents: activeCount,
          averageProgress: Math.round(averageProgress),
          completionRate: Math.round(completionRate),
          averageQuizScore: avgQuizScore,
          dropoffRate: Math.round(dropoffRate)
        };
      });

      const analytics = await Promise.all(analyticsPromises);
      setCourseAnalytics(analytics);

      const { count: totalStudents } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('is_active', true);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentActivity } = await supabase
        .from('video_progress')
        .select('student_id')
        .gte('last_watched_at', sevenDaysAgo.toISOString());

      const activeStudents = new Set(recentActivity?.map(r => r.student_id)).size;

      const { count: totalCertificates } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true });

      const { data: allAttempts } = await supabase
        .from('quiz_attempts')
        .select('score');

      const totalQuizAttempts = allAttempts?.length || 0;
      const averageQuizScore = allAttempts && allAttempts.length > 0
        ? Math.round(allAttempts.reduce((sum, a) => sum + a.score, 0) / allAttempts.length)
        : 0;

      const averageCompletionRate = analytics.length > 0
        ? Math.round(analytics.reduce((sum, a) => sum + a.completionRate, 0) / analytics.length)
        : 0;

      setGlobalStats({
        totalStudents: totalStudents || 0,
        activeStudents,
        totalCertificates: totalCertificates || 0,
        averageCompletionRate,
        totalQuizAttempts,
        averageQuizScore
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Chargement des analytics...</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = courseAnalytics.map(c => ({
    name: c.courseTitle.substring(0, 20),
    completion: c.completionRate,
    progress: c.averageProgress,
    score: c.averageQuizScore
  }));

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Étudiants totaux</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{globalStats.totalStudents}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {globalStats.activeStudents} actifs (7j)
                </p>
              </div>
              <Users className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Certificats délivrés</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{globalStats.totalCertificates}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {globalStats.averageCompletionRate}% taux de complétion
                </p>
              </div>
              <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Tentatives de quiz</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{globalStats.totalQuizAttempts}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Score moyen: {globalStats.averageQuizScore}%
                </p>
              </div>
              <Award className="w-8 h-8 md:w-10 md:h-10 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg text-foreground">Performance par cours</CardTitle>
          <CardDescription className="text-xs md:text-sm text-muted-foreground">
            Analyse comparative des taux de complétion et scores
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
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
              <Bar dataKey="completion" fill="hsl(var(--primary))" name="Taux complétion" radius={[8, 8, 0, 0]} />
              <Bar dataKey="score" fill="hsl(var(--accent))" name="Score quiz" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg text-foreground">Détails par cours</CardTitle>
          <CardDescription className="text-xs md:text-sm text-muted-foreground">
            Métriques détaillées pour chaque formation
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-foreground">Cours</TableHead>
                <TableHead className="text-foreground">Étudiants</TableHead>
                <TableHead className="text-foreground">Actifs</TableHead>
                <TableHead className="text-foreground">Progression moy.</TableHead>
                <TableHead className="text-foreground">Taux complétion</TableHead>
                <TableHead className="text-foreground">Score quiz</TableHead>
                <TableHead className="text-foreground">Taux abandon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseAnalytics.map((course) => (
                <TableRow key={course.courseId}>
                  <TableCell className="text-foreground font-medium">{course.courseTitle}</TableCell>
                  <TableCell className="text-muted-foreground">{course.totalStudents}</TableCell>
                  <TableCell className="text-muted-foreground">{course.activeStudents}</TableCell>
                  <TableCell>
                    <Badge variant={course.averageProgress >= 70 ? "default" : "secondary"}>
                      {course.averageProgress}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={course.completionRate >= 50 ? "default" : "secondary"}>
                      {course.completionRate}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={course.averageQuizScore >= 70 ? "default" : "secondary"}>
                      {course.averageQuizScore}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={course.dropoffRate <= 30 ? "default" : "destructive"}>
                      {course.dropoffRate}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};