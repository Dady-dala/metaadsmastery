import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Download, FileText, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { generateCertificate } from '@/utils/certificateGenerator';

interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  certificateUrl: string | null;
  issuedAt: string;
  isCompleted: boolean;
  completionPercentage: number;
}

export const StudentCertificates = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Récupérer tous les cours auxquels l'étudiant est inscrit
      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select('course_id')
        .eq('student_id', session.user.id);

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      const courseIds = enrollments.map(e => e.course_id);

      // Récupérer les informations des cours
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title, is_certifying')
        .in('id', courseIds);

      if (!courses) {
        setLoading(false);
        return;
      }

      // Récupérer les certificats existants
      const { data: existingCertificates } = await supabase
        .from('certificates')
        .select('*')
        .eq('student_id', session.user.id)
        .in('course_id', courseIds);

      // Calculer la complétion pour chaque cours
      const certificateData = await Promise.all(
        courses.map(async (course) => {
          // Récupérer toutes les vidéos du cours
          const { data: videos } = await supabase
            .from('course_videos')
            .select('id')
            .eq('course_id', course.id);

          const videoCount = videos?.length || 0;

          // Récupérer la progression vidéo de l'étudiant
          const { data: videoProgress } = await supabase
            .from('video_progress')
            .select('completed')
            .eq('student_id', session.user.id)
            .in('video_id', videos?.map(v => v.id) || [])
            .eq('completed', true);

          const completedVideos = videoProgress?.length || 0;

          // Récupérer tous les quiz requis du cours
          const { data: requiredQuizzes } = await supabase
            .from('quizzes')
            .select('id')
            .eq('course_id', course.id)
            .eq('is_required', true);

          const requiredQuizCount = requiredQuizzes?.length || 0;

          // Récupérer les quiz réussis
          const { data: passedQuizzes } = await supabase
            .from('quiz_attempts')
            .select('quiz_id')
            .eq('student_id', session.user.id)
            .in('quiz_id', requiredQuizzes?.map(q => q.id) || [])
            .eq('passed', true);

          // Compter les quiz uniques réussis
          const uniquePassedQuizzes = new Set(passedQuizzes?.map(q => q.quiz_id) || []);
          const passedQuizCount = uniquePassedQuizzes.size;

          const totalRequirements = videoCount + requiredQuizCount;
          const completedRequirements = completedVideos + passedQuizCount;
          const completionPercentage = totalRequirements > 0 
            ? Math.round((completedRequirements / totalRequirements) * 100) 
            : 0;

          const isCompleted = completionPercentage === 100;

          // Vérifier si un certificat existe
          const existingCert = existingCertificates?.find(c => c.course_id === course.id);

          return {
            id: existingCert?.id || course.id,
            courseId: course.id,
            courseTitle: course.title,
            certificateUrl: existingCert?.certificate_url || null,
            issuedAt: existingCert?.issued_at || '',
            isCompleted: isCompleted && course.is_certifying,
            completionPercentage
          };
        })
      );

      setCertificates(certificateData);
    } catch (error) {
      console.error('Error loading certificates:', error);
      toast.error('Erreur lors du chargement des certificats');
    } finally {
      setLoading(false);
    }
  };

  const generateMissingCertificate = async (courseId: string, courseTitle: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const pdfDataUri = await generateCertificate({
        studentId: session.user.id,
        courseName: courseTitle,
        completionDate: new Date().toLocaleDateString('fr-FR')
      });

      const { error } = await supabase
        .from('certificates')
        .insert({
          student_id: session.user.id,
          course_id: courseId,
          certificate_url: pdfDataUri
        });

      if (error) throw error;

      toast.success('🎉 Certificat généré avec succès !');
      loadCertificates();
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('Erreur lors de la génération du certificat');
    }
  };

  const downloadCertificate = (certificateUrl: string, courseTitle: string) => {
    const link = document.createElement('a');
    link.href = certificateUrl;
    link.download = `Certificat_${courseTitle.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Téléchargement du certificat en cours');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Chargement des certificats...</div>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <Award className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Aucun cours disponible
          </h2>
          <p className="text-muted-foreground">
            Vous n'êtes inscrit à aucun cours pour le moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-primary" />
            <div>
              <CardTitle className="text-foreground">Mes Certificats</CardTitle>
              <CardDescription className="text-muted-foreground">
                Téléchargez vos certificats de réussite
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificates.map((cert) => (
          <Card 
            key={cert.id} 
            className={`bg-card border-border ${
              cert.isCompleted ? 'border-primary/50' : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-foreground flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-primary" />
                    {cert.courseTitle}
                  </CardTitle>
                  {cert.isCompleted && cert.certificateUrl && (
                    <Badge variant="secondary" className="gap-1 mb-2">
                      <CheckCircle2 className="w-3 h-3" />
                      Certificat disponible
                    </Badge>
                  )}
                  {cert.isCompleted && !cert.certificateUrl && (
                    <Badge variant="outline" className="gap-1 mb-2 border-primary text-primary">
                      <Clock className="w-3 h-3" />
                      Certificat à générer
                    </Badge>
                  )}
                  {!cert.isCompleted && (
                    <Badge variant="outline" className="gap-1 mb-2">
                      <Clock className="w-3 h-3" />
                      En cours - {cert.completionPercentage}%
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cert.issuedAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>Délivré le {new Date(cert.issuedAt).toLocaleDateString('fr-FR')}</span>
                </div>
              )}

              {cert.isCompleted && cert.certificateUrl ? (
                <Button
                  onClick={() => downloadCertificate(cert.certificateUrl!, cert.courseTitle)}
                  className="w-full gap-2"
                  variant="default"
                >
                  <Download className="w-4 h-4" />
                  Télécharger le certificat
                </Button>
              ) : cert.isCompleted && !cert.certificateUrl ? (
                <Button
                  onClick={() => generateMissingCertificate(cert.courseId, cert.courseTitle)}
                  className="w-full gap-2"
                  variant="default"
                >
                  <Award className="w-4 h-4" />
                  Générer le certificat
                </Button>
              ) : (
                <div className="text-sm text-muted-foreground">
                  <div className="mb-2">Progression : {cert.completionPercentage}%</div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${cert.completionPercentage}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs">
                    Complétez le cours à 100% pour obtenir votre certificat
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
