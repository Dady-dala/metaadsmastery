import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import { LogOut, PlayCircle, BookOpen, Settings, BarChart3, CheckCircle2, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSettings } from '@/components/student/ProfileSettings';
import { EnhancedCourseProgress } from '@/components/student/EnhancedCourseProgress';
import { QuizTaking } from '@/components/student/QuizTaking';
import { StudentCertificates } from '@/components/student/StudentCertificates';

interface Course {
  id: string;
  title: string;
  description: string;
}

interface CourseVideo {
  id: string;
  course_id: string;
  title: string;
  description: string;
  wistia_media_id: string;
  order_index: number;
}

const EspaceFormation = () => {
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseVideos, setCourseVideos] = useState<CourseVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<CourseVideo | null>(null);
  const [videoProgress, setVideoProgress] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'videos' | 'quiz'>('videos');
  const navigate = useNavigate();

  useEffect(() => {
    loadEnrolledCourses();
    
    // Load Wistia player script (web component standard method)
    const script = document.createElement('script');
    script.src = 'https://fast.wistia.com/player.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadCourseVideos(selectedCourse.id);
      loadVideoProgress(selectedCourse.id);
    }
  }, [selectedCourse]);

  const loadVideoProgress = async (courseId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: videos } = await supabase
        .from('course_videos')
        .select('id')
        .eq('course_id', courseId);

      if (!videos) return;

      const { data: progress } = await supabase
        .from('video_progress')
        .select('video_id, completed')
        .eq('student_id', session.user.id)
        .in('video_id', videos.map(v => v.id));

      const progressMap: Record<string, boolean> = {};
      progress?.forEach(p => {
        progressMap[p.video_id] = p.completed;
      });
      setVideoProgress(progressMap);
    } catch (error) {
      console.error('Error loading video progress:', error);
    }
  };

  const markVideoAsCompleted = async (videoId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('video_progress')
        .upsert({
          student_id: session.user.id,
          video_id: videoId,
          completed: true,
          watch_percentage: 100
        });

      if (error) throw error;

      setVideoProgress(prev => ({ ...prev, [videoId]: true }));
      toast.success('Vidéo marquée comme terminée');
      
      if (selectedCourse) {
        loadVideoProgress(selectedCourse.id);
      }
    } catch (error) {
      console.error('Error marking video as completed:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const loadEnrolledCourses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('student_enrollments')
        .select('course_id')
        .eq('student_id', session.user.id);

      if (enrollmentsError) throw enrollmentsError;

      if (enrollments && enrollments.length > 0) {
        const courseIds = enrollments.map(e => e.course_id);
        const { data: courses, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .in('id', courseIds);

        if (coursesError) throw coursesError;
        setEnrolledCourses(courses || []);
        
        if (courses && courses.length > 0) {
          setSelectedCourse(courses[0]);
        }
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des cours');
    } finally {
      setLoading(false);
    }
  };

  const loadCourseVideos = async (courseId: string) => {
    try {
      const { data: videos, error } = await supabase
        .from('course_videos')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setCourseVideos(videos || []);
      
      if (videos && videos.length > 0) {
        setSelectedVideo(videos[0]);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des vidéos');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Déconnexion réussie');
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Espace Formation - Meta Ads Mastery"
        description="Accédez à votre espace de formation Meta Ads Mastery"
        keywords="formation, meta ads, apprentissage, cours en ligne"
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">Espace Formation</h1>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-border hover:bg-muted"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>

          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-card border-border mb-6">
              <TabsTrigger value="courses" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BookOpen className="w-4 h-4 mr-2" />
                Mes Cours
              </TabsTrigger>
              <TabsTrigger value="progress" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="w-4 h-4 mr-2" />
                Progression
              </TabsTrigger>
              <TabsTrigger value="certificates" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Award className="w-4 h-4 mr-2" />
                Certificats
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Settings className="w-4 h-4 mr-2" />
                Paramètres
              </TabsTrigger>
            </TabsList>

            {/* Onglet Cours */}
            <TabsContent value="courses">
              {enrolledCourses.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-8 text-center">
                    <BookOpen className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      Aucun cours disponible
                    </h2>
                    <p className="text-muted-foreground">
                      Vous n'êtes inscrit à aucun cours pour le moment.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Left sidebar - Course list */}
                  <div className="lg:col-span-1">
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-primary" />
                          Mes Cours
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {enrolledCourses.map((course) => (
                          <Button
                            key={course.id}
                            variant={selectedCourse?.id === course.id ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => setSelectedCourse(course)}
                          >
                            {course.title}
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Main content - Video player and details */}
                  <div className="lg:col-span-3 space-y-6">
                    {selectedCourse && (
                      <>
                        <Card className="bg-card border-border">
                          <CardHeader>
                            <CardTitle className="text-foreground">{selectedCourse.title}</CardTitle>
                            {selectedCourse.description && (
                              <CardDescription className="text-muted-foreground">
                                {selectedCourse.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                          {selectedVideo && (
                            <CardContent>
                              <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                                <wistia-player 
                                  media-id={selectedVideo.wistia_media_id}
                                  seo="true"
                                  aspect="1.7777777777777777"
                                  className="w-full h-full"
                                ></wistia-player>
                              </div>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="text-xl font-semibold text-foreground mb-2">
                                    {selectedVideo.title}
                                  </h3>
                                  {selectedVideo.description && (
                                    <p className="text-muted-foreground">{selectedVideo.description}</p>
                                  )}
                                </div>
                                {!videoProgress[selectedVideo.id] && (
                                  <Button
                                    onClick={() => markVideoAsCompleted(selectedVideo.id)}
                                    variant="outline"
                                    className="border-success text-success hover:bg-success hover:text-success-foreground shrink-0"
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Terminé
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          )}
                        </Card>

                        {/* Tabs vidéos / quiz */}
                        <Card className="bg-card border-border">
                          <CardHeader>
                            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'videos' | 'quiz')} className="w-full">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="videos">Vidéos du cours</TabsTrigger>
                                <TabsTrigger value="quiz">Quiz</TabsTrigger>
                              </TabsList>
                            </Tabs>
                          </CardHeader>
                          <CardContent>
                            {activeTab === 'videos' ? (
                              <div className="space-y-2">
                                {courseVideos.map((video, index) => (
                                  <Button
                                    key={video.id}
                                    variant={selectedVideo?.id === video.id ? "default" : "outline"}
                                    className="w-full justify-between"
                                    onClick={() => setSelectedVideo(video)}
                                  >
                                    <span className="flex items-center">
                                      <span className="mr-2">{index + 1}.</span>
                                      {video.title}
                                    </span>
                                    {videoProgress[video.id] && (
                                      <CheckCircle2 className="w-4 h-4 text-success" />
                                    )}
                                  </Button>
                                ))}
                              </div>
                            ) : (
                              <QuizTaking 
                                courseId={selectedCourse.id} 
                                videoId={selectedVideo?.id}
                              />
                            )}
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Onglet Progression */}
            <TabsContent value="progress">
              <EnhancedCourseProgress />
            </TabsContent>

            {/* Onglet Certificats */}
            <TabsContent value="certificates">
              <StudentCertificates />
            </TabsContent>

            {/* Onglet Paramètres */}
            <TabsContent value="settings">
              <ProfileSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default EspaceFormation;
