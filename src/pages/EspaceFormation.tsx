import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import { LogOut, PlayCircle, BookOpen } from 'lucide-react';

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
  const navigate = useNavigate();

  useEffect(() => {
    loadEnrolledCourses();
    
    // Dynamically load Wistia scripts
    const script1 = document.createElement('script');
    script1.src = 'https://fast.wistia.com/assets/external/E-v1.js';
    script1.async = true;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = 'https://fast.wistia.com/embed/medias/wfrtok35jw.jsonp';
    script2.async = true;
    document.head.appendChild(script2);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadCourseVideos(selectedCourse.id);
    }
  }, [selectedCourse]);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0033] via-[#2d0052] to-[#1a0033]">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Espace Formation - Meta Ads Mastery"
        description="Accédez à votre formation Meta Ads Mastery"
      />
      <div className="min-h-screen bg-gradient-to-br from-[#1a0033] via-[#2d0052] to-[#1a0033] p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Espace Formation
            </h1>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="bg-white/10 border-[#00ff87] text-white hover:bg-[#00ff87] hover:text-black"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>

          {enrolledCourses.length === 0 ? (
            <Card className="bg-white/5 border-[#00ff87]/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  Aucun cours disponible
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Vous n'êtes inscrit à aucun cours pour le moment. Veuillez contacter l'administrateur.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Liste des cours */}
              <div className="lg:col-span-1">
                <Card className="bg-white/5 border-[#00ff87]/20">
                  <CardHeader>
                    <CardTitle className="text-white">Mes Cours</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {enrolledCourses.map((course) => (
                      <Button
                        key={course.id}
                        onClick={() => setSelectedCourse(course)}
                        variant={selectedCourse?.id === course.id ? "default" : "outline"}
                        className={`w-full justify-start ${
                          selectedCourse?.id === course.id
                            ? 'bg-[#00ff87] text-black hover:bg-[#00ff87]/90'
                            : 'bg-white/10 border-[#00ff87]/20 text-white hover:bg-white/20'
                        }`}
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
                        {course.title}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Lecteur vidéo et liste des vidéos */}
              <div className="lg:col-span-3">
                {selectedCourse && (
                  <>
                    <Card className="bg-white/5 border-[#00ff87]/20 mb-6">
                      <CardHeader>
                        <CardTitle className="text-white">{selectedCourse.title}</CardTitle>
                        {selectedCourse.description && (
                          <CardDescription className="text-gray-300">
                            {selectedCourse.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      {selectedVideo && (
                        <CardContent>
                          <div className="aspect-video bg-black rounded-lg overflow-hidden">
                            <wistia-player 
                              media-id={selectedVideo.wistia_media_id}
                              seo="false"
                              aspect="1.7777777777777777"
                              className="w-full h-full"
                            />
                          </div>
                          <div className="mt-4">
                            <h3 className="text-xl font-semibold text-white mb-2">
                              {selectedVideo.title}
                            </h3>
                            {selectedVideo.description && (
                              <p className="text-gray-300">{selectedVideo.description}</p>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>

                    <Card className="bg-white/5 border-[#00ff87]/20">
                      <CardHeader>
                        <CardTitle className="text-white">Liste des vidéos</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {courseVideos.length === 0 ? (
                          <p className="text-gray-400">Aucune vidéo disponible pour ce cours.</p>
                        ) : (
                          courseVideos.map((video, index) => (
                            <Button
                              key={video.id}
                              onClick={() => setSelectedVideo(video)}
                              variant={selectedVideo?.id === video.id ? "default" : "outline"}
                              className={`w-full justify-start ${
                                selectedVideo?.id === video.id
                                  ? 'bg-[#00ff87] text-black hover:bg-[#00ff87]/90'
                                  : 'bg-white/10 border-[#00ff87]/20 text-white hover:bg-white/20'
                              }`}
                            >
                              <PlayCircle className="mr-2 h-4 w-4" />
                              <span className="mr-2 font-semibold">{index + 1}.</span>
                              {video.title}
                            </Button>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EspaceFormation;
