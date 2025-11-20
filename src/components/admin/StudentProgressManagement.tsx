import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface StudentProgress {
  studentId: string;
  studentEmail: string;
  courseName: string;
  totalVideos: number;
  completedVideos: number;
  progressPercentage: number;
  lastActivity: string | null;
  status: 'active' | 'inactive';
}

const StudentProgressManagement = () => {
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<StudentProgress[]>([]);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      setLoading(true);

      // Get all students with their roles
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vous devez être connecté');
        return;
      }

      // Get all students with enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from('student_enrollments')
        .select(`
          student_id,
          course_id,
          courses (
            id,
            title
          )
        `);

      if (enrollError) throw enrollError;

      // Get all students info via edge function
      const { data: usersData, error: usersError } = await supabase.functions.invoke('get-users');
      if (usersError) throw usersError;

      const students = usersData?.users?.filter((u: any) => 
        u.roles?.some((r: string) => r === 'student')
      ) || [];

      // Get all video progress
      const { data: progressRecords, error: progressError } = await supabase
        .from('video_progress')
        .select('student_id, video_id, completed, last_watched_at');

      if (progressError) throw progressError;

      // Get all videos with their courses
      const { data: videos, error: videosError } = await supabase
        .from('course_videos')
        .select('id, course_id');

      if (videosError) throw videosError;

      // Build progress data
      const progressMap: StudentProgress[] = [];

      for (const enrollment of enrollments || []) {
        const student = students.find((s: any) => s.id === enrollment.student_id);
        if (!student) continue;

        const courseVideos = videos?.filter(v => v.course_id === enrollment.course_id) || [];
        const studentProgress = progressRecords?.filter(p => 
          p.student_id === enrollment.student_id &&
          courseVideos.some(v => v.id === p.video_id)
        ) || [];

        const completedCount = studentProgress.filter(p => p.completed).length;
        const totalCount = courseVideos.length;
        const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        const lastActivity = studentProgress.length > 0
          ? studentProgress.reduce((latest, current) => {
              return new Date(current.last_watched_at) > new Date(latest)
                ? current.last_watched_at
                : latest;
            }, studentProgress[0].last_watched_at)
          : null;

        const daysSinceActivity = lastActivity
          ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        progressMap.push({
          studentId: enrollment.student_id,
          studentEmail: student.email,
          courseName: enrollment.courses?.title || 'N/A',
          totalVideos: totalCount,
          completedVideos: completedCount,
          progressPercentage: percentage,
          lastActivity,
          status: daysSinceActivity <= 7 ? 'active' : 'inactive'
        });
      }

      setProgressData(progressMap);
    } catch (error: any) {
      console.error('Erreur lors du chargement des progressions:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Chargement des progressions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suivi de Progression des Étudiants</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Cours</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead>Vidéos</TableHead>
                <TableHead>Dernière activité</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {progressData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aucun étudiant inscrit pour le moment
                  </TableCell>
                </TableRow>
              ) : (
                progressData.map((progress, index) => (
                  <TableRow key={`${progress.studentId}-${progress.courseName}-${index}`}>
                    <TableCell className="font-medium">
                      {progress.studentEmail}
                    </TableCell>
                    <TableCell>{progress.courseName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={progress.progressPercentage} className="w-[100px]" />
                        <span className="text-sm text-muted-foreground">
                          {progress.progressPercentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {progress.completedVideos} / {progress.totalVideos}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(progress.lastActivity)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={progress.status === 'active' ? 'default' : 'secondary'}
                      >
                        {progress.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentProgressManagement;
