import { supabase } from "@/integrations/supabase/client";

export const checkAndAwardBadges = async (userId: string) => {
  try {
    // Get all badges and user's progress
    const [badgesResult, earnedBadgesResult, progressData] = await Promise.all([
      supabase.from("badges").select("*"),
      supabase
        .from("student_badges")
        .select("badge_id")
        .eq("student_id", userId),
      Promise.all([
        supabase
          .from("video_progress")
          .select("*", { count: "exact" })
          .eq("student_id", userId)
          .eq("completed", true),
        supabase
          .from("quiz_attempts")
          .select("*", { count: "exact" })
          .eq("student_id", userId)
          .eq("passed", true),
        supabase
          .from("video_notes")
          .select("*", { count: "exact" })
          .eq("student_id", userId),
      ]),
    ]);

    if (badgesResult.error) throw badgesResult.error;
    if (earnedBadgesResult.error) throw earnedBadgesResult.error;

    const badges = badgesResult.data;
    const earnedBadgeIds = new Set(earnedBadgesResult.data.map(eb => eb.badge_id));
    
    const progress = {
      videos_completed: progressData[0].count || 0,
      quizzes_passed: progressData[1].count || 0,
      notes_created: progressData[2].count || 0,
    };

    // Check which badges should be awarded
    const newBadges = [];
    for (const badge of badges) {
      if (earnedBadgeIds.has(badge.id)) continue;

      const currentProgress = progress[badge.requirement_type as keyof typeof progress] || 0;
      if (currentProgress >= badge.requirement_count) {
        newBadges.push(badge);
      }
    }

    // Award new badges
    if (newBadges.length > 0) {
      const { error: insertError } = await supabase
        .from("student_badges")
        .insert(
          newBadges.map(badge => ({
            student_id: userId,
            badge_id: badge.id,
          }))
        );

      if (insertError) throw insertError;

      // Create notifications for new badges
      const { error: notifError } = await supabase
        .from("notifications")
        .insert(
          newBadges.map(badge => ({
            user_id: userId,
            title: "🎉 Nouveau badge débloqué!",
            message: `Vous avez obtenu le badge "${badge.name}": ${badge.description}`,
            type: "badge",
            link: "/espace-formation",
          }))
        );

      if (notifError) throw notifError;
    }

    return newBadges;
  } catch (error) {
    console.error("Error checking badges:", error);
    return [];
  }
};
