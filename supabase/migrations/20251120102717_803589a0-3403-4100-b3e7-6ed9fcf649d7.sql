-- Table pour suivre la progression des vidéos par étudiant
CREATE TABLE public.video_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.course_videos(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  last_watched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  watch_percentage INTEGER NOT NULL DEFAULT 0,
  UNIQUE(student_id, video_id)
);

-- Enable RLS
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

-- Students can view their own progress
CREATE POLICY "Students can view their own progress"
ON public.video_progress
FOR SELECT
USING (auth.uid() IS NOT NULL AND student_id = auth.uid());

-- Students can insert their own progress
CREATE POLICY "Students can insert their own progress"
ON public.video_progress
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND student_id = auth.uid());

-- Students can update their own progress
CREATE POLICY "Students can update their own progress"
ON public.video_progress
FOR UPDATE
USING (auth.uid() IS NOT NULL AND student_id = auth.uid());

-- Admins can view all progress
CREATE POLICY "Admins can view all progress"
ON public.video_progress
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for performance
CREATE INDEX idx_video_progress_student ON public.video_progress(student_id);
CREATE INDEX idx_video_progress_video ON public.video_progress(video_id);