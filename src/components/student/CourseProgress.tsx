import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckCircle2, Clock } from 'lucide-react';

interface CourseProgressData {
  courseId: string;
  courseTitle: string;
  totalVideos: number;
  completedVideos: number;
  progressPercentage: number;
}

interface Props {
  courseId?: string;
}

export const CourseProgress = ({ courseId }: Props) => {
  const [progressData, setProgressData] = useState<CourseProgressData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [courseId]);

  const loadProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get enrolled courses
      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select('course_id')
        .eq('student_id', session.user.id);

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      const courseIds = enrollments.map(e => e.course_id);
      const filteredCourseIds = courseId ? [courseId] : courseIds;

      // Get courses details
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', filteredCourseIds);

      if (!courses) {
        setLoading(false);
        return;
      }

      // Calculate progress for each course
      const progressPromises = courses.map(async (course) => {
        // Get all videos for this course
        const { data: videos } = await supabase
          .from('course_videos')
          .select('id')
          .eq('course_id', course.id);

        const totalVideos = videos?.length || 0;

        // Get completed videos
        const { data: completedVideos } = await supabase
          .from('video_progress')
          .select('id')
          .eq('student_id', session.user.id)
          .in('video_id', videos?.map(v => v.id) || [])
          .eq('completed', true);

        const completed = completedVideos?.length || 0;
        const progressPercentage = totalVideos > 0 ? Math.round((completed / totalVideos) * 100) : 0;

        return {
          courseId: course.id,
          courseTitle: course.title,
          totalVideos,
          completedVideos: completed,
          progressPercentage
        };
      });

      const progress = await Promise.all(progressPromises);
      setProgressData(progress);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="space-y-4">
      {progressData.map((progress) => (
        <Card key={progress.courseId} className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              {progress.courseTitle}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Votre progression dans ce cours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progression globale</span>
                <span className="text-foreground font-semibold">{progress.progressPercentage}%</span>
              </div>
              <Progress value={progress.progressPercentage} className="h-3" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
