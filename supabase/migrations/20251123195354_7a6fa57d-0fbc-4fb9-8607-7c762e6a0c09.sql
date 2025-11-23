-- Create badges table to define available badges
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  requirement_type text NOT NULL, -- 'videos_completed', 'quizzes_passed', 'course_completed', 'notes_created'
  requirement_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create student_badges table to track earned badges
CREATE TABLE public.student_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(student_id, badge_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL, -- 'course', 'quiz', 'badge', 'reminder', 'system'
  is_read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badges
CREATE POLICY "Anyone can view badges"
  ON public.badges
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage badges"
  ON public.badges
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for student_badges
CREATE POLICY "Students can view their own badges"
  ON public.student_badges
  FOR SELECT
  USING (auth.uid() = student_id AND has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Students can insert their own badges"
  ON public.student_badges
  FOR INSERT
  WITH CHECK (auth.uid() = student_id AND has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Admins can view all student badges"
  ON public.student_badges
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications"
  ON public.notifications
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_student_badges_student_id ON public.student_badges(student_id);
CREATE INDEX idx_student_badges_badge_id ON public.student_badges(badge_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Insert default badges
INSERT INTO public.badges (name, description, icon, requirement_type, requirement_count) VALUES
  ('Premier Pas', 'Regardez votre première vidéo', '🎬', 'videos_completed', 1),
  ('Apprenant Assidu', 'Complétez 10 vidéos', '📚', 'videos_completed', 10),
  ('Expert Vidéo', 'Complétez 50 vidéos', '🎓', 'videos_completed', 50),
  ('Quiz Débutant', 'Réussissez votre premier quiz', '✅', 'quizzes_passed', 1),
  ('Maître des Quiz', 'Réussissez 10 quiz', '🏆', 'quizzes_passed', 10),
  ('Écrivain', 'Créez 5 notes', '📝', 'notes_created', 5),
  ('Chroniqueur', 'Créez 25 notes', '✍️', 'notes_created', 25),
  ('Diplômé', 'Terminez votre premier cours', '🎖️', 'course_completed', 1);