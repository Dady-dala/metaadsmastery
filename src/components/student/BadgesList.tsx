import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Lock } from "lucide-react";

export const BadgesList = () => {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: allBadges } = useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("requirement_count");
      if (error) throw error;
      return data;
    },
  });

  const { data: earnedBadges } = useQuery({
    queryKey: ["student-badges", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("student_badges")
        .select("*, badge:badges(*)")
        .eq("student_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: progress } = useQuery({
    queryKey: ["badge-progress", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const [videosResult, quizzesResult, notesResult] = await Promise.all([
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
          .from("video_notes")
          .select("*", { count: "exact" })
          .eq("student_id", user.id),
      ]);

      return {
        videos_completed: videosResult.count || 0,
        quizzes_passed: quizzesResult.count || 0,
        notes_created: notesResult.count || 0,
      };
    },
    enabled: !!user?.id,
  });

  const earnedBadgeIds = new Set(earnedBadges?.map(eb => eb.badge_id));

  const getProgressForBadge = (badge: any) => {
    if (!progress) return 0;
    const current = progress[badge.requirement_type as keyof typeof progress] || 0;
    return Math.min((current / badge.requirement_count) * 100, 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Mes Badges
        </CardTitle>
        <CardDescription>
          Débloquez des badges en progressant dans vos formations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allBadges?.map((badge) => {
            const isEarned = earnedBadgeIds.has(badge.id);
            const progressValue = getProgressForBadge(badge);

            return (
              <div
                key={badge.id}
                className={`relative p-4 rounded-lg border ${
                  isEarned
                    ? "bg-primary/10 border-primary"
                    : "bg-muted/50 border-muted"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`text-4xl ${!isEarned && "opacity-30"}`}>
                    {isEarned ? badge.icon : <Lock className="w-10 h-10" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{badge.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {badge.description}
                    </p>
                    {isEarned ? (
                      <Badge variant="default" className="mt-2">
                        Débloqué
                      </Badge>
                    ) : (
                      <div className="mt-2 space-y-1">
                        <Progress value={progressValue} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          Progression: {Math.round(progressValue)}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
