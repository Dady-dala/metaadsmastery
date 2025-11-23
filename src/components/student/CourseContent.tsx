import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle2 } from "lucide-react";
import { WistiaPlayer } from "@wistia/wistia-player-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoNotes } from "./VideoNotes";
import { QuizTaking } from "./QuizTaking";

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

interface CourseContentProps {
  enrolledCourses: Course[];
  selectedCourse: Course | null;
  setSelectedCourse: (course: Course) => void;
  courseVideos: CourseVideo[];
  selectedVideo: CourseVideo | null;
  setSelectedVideo: (video: CourseVideo) => void;
  videoProgress: Record<string, boolean>;
  markVideoAsCompleted: (videoId: string) => void;
  currentTime: number;
  handleSeekTo: (time: number) => void;
  activeTab: 'videos' | 'quiz';
  setActiveTab: (tab: 'videos' | 'quiz') => void;
}

export function CourseContent({
  enrolledCourses,
  selectedCourse,
  setSelectedCourse,
  courseVideos,
  selectedVideo,
  setSelectedVideo,
  videoProgress,
  markVideoAsCompleted,
  currentTime,
  handleSeekTo,
  activeTab,
  setActiveTab,
}: CourseContentProps) {
  if (enrolledCourses.length === 0) {
    return (
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
    );
  }

  return (
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
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                        <WistiaPlayer
                          mediaId={selectedVideo.wistia_media_id}
                          aspect={1.7777777777777777}
                          seo={true}
                          className="w-full h-full"
                        />
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
                    </div>
                    <div className="lg:col-span-1">
                      <VideoNotes
                        videoId={selectedVideo.id}
                        currentTime={currentTime}
                        onSeekTo={handleSeekTo}
                      />
                    </div>
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
  );
}
