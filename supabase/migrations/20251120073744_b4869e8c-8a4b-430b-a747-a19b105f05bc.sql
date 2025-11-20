-- Migration 2: Créer les tables pour les cours et inscriptions

-- Table des cours (pour l'instant Meta Ads Mastery uniquement)
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des vidéos de cours (structure plate avec ordre)
CREATE TABLE public.course_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  wistia_media_id TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des inscriptions étudiants (assignation par admin)
CREATE TABLE public.student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour courses
CREATE POLICY "Admins can manage courses"
ON public.courses
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view courses"
ON public.courses
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'student'::app_role)
  )
);

-- RLS Policies pour course_videos
CREATE POLICY "Admins can manage videos"
ON public.course_videos
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view videos of enrolled courses"
ON public.course_videos
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    (
      has_role(auth.uid(), 'student'::app_role) AND
      EXISTS (
        SELECT 1 FROM public.student_enrollments
        WHERE student_id = auth.uid()
        AND course_id = course_videos.course_id
      )
    )
  )
);

-- RLS Policies pour student_enrollments
CREATE POLICY "Admins can manage enrollments"
ON public.student_enrollments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their own enrollments"
ON public.student_enrollments
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    student_id = auth.uid()
  )
);

-- Index pour performance
CREATE INDEX idx_course_videos_course_id ON public.course_videos(course_id);
CREATE INDEX idx_course_videos_order ON public.course_videos(course_id, order_index);
CREATE INDEX idx_student_enrollments_student_id ON public.student_enrollments(student_id);
CREATE INDEX idx_student_enrollments_course_id ON public.student_enrollments(course_id);