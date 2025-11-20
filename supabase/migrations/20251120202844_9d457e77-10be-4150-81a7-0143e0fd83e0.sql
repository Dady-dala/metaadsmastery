-- Add video_id and is_required columns to quizzes table
ALTER TABLE public.quizzes 
ADD COLUMN video_id uuid REFERENCES public.course_videos(id) ON DELETE CASCADE,
ADD COLUMN is_required boolean NOT NULL DEFAULT false;

-- Add comment to clarify the structure
COMMENT ON COLUMN public.quizzes.video_id IS 'If null, this is a course-level quiz. If not null, this is a lesson/video-level quiz.';
COMMENT ON COLUMN public.quizzes.is_required IS 'Whether students must complete this quiz to progress in the course.';

-- Create index for better performance when querying quizzes by video
CREATE INDEX idx_quizzes_video_id ON public.quizzes(video_id);