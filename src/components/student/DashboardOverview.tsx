import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trophy, Target, Clock, TrendingUp, Award } from "lucide-react";

export function DashboardOverview() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const [
        enrollmentsResult,
        videosCompletedResult,
        quizzesPassed,
        badgesEarned,
        allVideosResult,
      ] = await Promise.all([
        supabase
          .from("student_enrollments")
          .select("course_id", { count: "exact" })
          .eq("student_id", user.id),
        supabase
          .from("video_progress")
          .select("*", { count: "exact" })
          .eq("student_id", user.id)
          .eq("completed", true),
        supabase
          .from("quiz_attempts")
          .select("*", { count: "exact" })
          .eq("student_id", user.id)
          .eq("passed", true),
        supabase
          .from("student_badges")
          .select("*, badge:badges(*)")
          .eq("student_id", user.id),
        supabase
          .from("video_progress")
          .select("*")
          .eq("student_id", user.id),
      ]);

      const courseIds = enrollmentsResult.data?.map(e => e.course_id) || [];
      const totalVideosResult = courseIds.length > 0
        ? await supabase
            .from("course_videos")
            .select("*", { count: "exact" })
            .in("course_id", courseIds)
        : { count: 0 };

      return {
        coursesEnrolled: enrollmentsResult.count || 0,
        videosCompleted: videosCompletedResult.count || 0,
        totalVideos: totalVideosResult.count || 0,
        quizzesPassed: quizzesPassed.count || 0,
        badgesEarned: badgesEarned.data?.length || 0,
        recentBadges: badgesEarned.data?.slice(-3) || [],
        completionRate: totalVideosResult.count 
          ? Math.round(((videosCompletedResult.count || 0) / totalVideosResult.count) * 100)
          : 0,
      };
    },
    enabled: !!user?.id,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["recent-activity", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("video_progress")
        .select("*, video:course_videos(title)")
        .eq("student_id", user.id)
        .order("last_watched_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (!stats) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-2">
            Bienvenue dans votre espace formation ! 👋
          </h2>
          <p className="text-muted-foreground">
            Continuez votre parcours d'apprentissage et débloquez de nouveaux badges
          </p>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cours inscrits</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.coursesEnrolled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vidéos terminées</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.videosCompleted}/{stats.totalVideos}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quiz réussis</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.quizzesPassed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Badges obtenus</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.badgesEarned}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Progression globale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Complétion des cours</span>
                <span className="text-sm text-muted-foreground">{stats.completionRate}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-3" />
            </div>

            <div className="pt-4">
              <h4 className="text-sm font-semibold mb-3">Activité récente</h4>
              <div className="space-y-2">
                {recentActivity?.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{activity.video?.title}</span>
                    </div>
                    {activity.completed && (
                      <Badge variant="outline" className="text-xs">Terminé</Badge>
                    )}
                  </div>
                ))}
                {(!recentActivity || recentActivity.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune activité récente
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Badges récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentBadges.length > 0 ? (
              <div className="space-y-3">
                {stats.recentBadges.map((studentBadge: any) => (
                  <div
                    key={studentBadge.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <div className="text-3xl">{studentBadge.badge.icon}</div>
                    <div>
                      <p className="font-semibold text-sm">{studentBadge.badge.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {studentBadge.badge.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Aucun badge pour le moment
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Continuez à apprendre pour débloquer des badges !
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
