import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import { CheckCircle2 } from 'lucide-react';
import { WistiaPlayer } from '@wistia/wistia-player-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ProfileSettings } from '@/components/student/ProfileSettings';
import { EnhancedCourseProgress } from '@/components/student/EnhancedCourseProgress';
import { QuizTaking } from '@/components/student/QuizTaking';
import { StudentCertificates } from '@/components/student/StudentCertificates';
import { VideoNotes } from '@/components/student/VideoNotes';
import { BadgesList } from '@/components/student/BadgesList';
import { NotificationsList } from '@/components/student/NotificationsList';
import { checkAndAwardBadges } from '@/utils/badgeChecker';
import { SidebarProvider } from '@/components/ui/sidebar';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentTopBar } from '@/components/student/StudentTopBar';
import { DashboardOverview } from '@/components/student/DashboardOverview';
import { CourseContent } from '@/components/student/CourseContent';

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
  const [currentTime, setCurrentTime] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    if (!selectedVideo) return;

    const interval = setInterval(() => {
      const wistiaApi = (window as any)._wq;
      if (wistiaApi) {
        wistiaApi.push({
          id: selectedVideo.wistia_media_id,
          onReady: (video: any) => {
            video.bind('timechange', (t: number) => {
              setCurrentTime(t);
            });
          },
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [selectedVideo]);

  useEffect(() => {
    loadEnrolledCourses();
    checkUserBadges();
  }, []);

  const checkUserBadges = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await checkAndAwardBadges(session.user.id);
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  };

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

      // Check for new badges
      await checkUserBadges();
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

  const handleSeekTo = (time: number) => {
    const video = (window as any)._wq?.find((item: any) => 
      item.id === selectedVideo?.wistia_media_id
    );
    if (video?.hasData?.()) {
      video.time(time);
    }
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
      
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <StudentSidebar />
          
          <div className="flex-1 flex flex-col">
            <StudentTopBar />
            
            <main className="flex-1 p-6">
              {currentTab === 'overview' && <DashboardOverview />}
              {currentTab === 'courses' && (
                <CourseContent
                  enrolledCourses={enrolledCourses}
                  selectedCourse={selectedCourse}
                  setSelectedCourse={setSelectedCourse}
                  courseVideos={courseVideos}
                  selectedVideo={selectedVideo}
                  setSelectedVideo={setSelectedVideo}
                  videoProgress={videoProgress}
                  markVideoAsCompleted={markVideoAsCompleted}
                  currentTime={currentTime}
                  handleSeekTo={handleSeekTo}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              )}
              {currentTab === 'progress' && (
                <div className="space-y-6">
                  <EnhancedCourseProgress />
                </div>
              )}
              {currentTab === 'badges' && <BadgesList />}
              {currentTab === 'notifications' && <NotificationsList />}
              {currentTab === 'settings' && <ProfileSettings />}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
};

export default EspaceFormation;
