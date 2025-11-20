-- Add is_active column to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.user_roles.is_active IS 'Indicates if the user role is active. When false, the user is suspended and cannot access protected resources.';

-- Update RLS policies to check is_active status

-- Drop existing policy for students viewing courses
DROP POLICY IF EXISTS "Students can view courses" ON public.courses;

-- Recreate policy with is_active check
CREATE POLICY "Students can view courses" 
ON public.courses 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND 
  (
    has_role(auth.uid(), 'admin'::app_role) OR 
    (
      has_role(auth.uid(), 'student'::app_role) AND
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'student'::app_role 
        AND is_active = true
      )
    )
  )
);

-- Drop existing policy for students viewing videos
DROP POLICY IF EXISTS "Students can view videos of enrolled courses" ON public.course_videos;

-- Recreate policy with is_active check
CREATE POLICY "Students can view videos of enrolled courses" 
ON public.course_videos 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND 
  (
    has_role(auth.uid(), 'admin'::app_role) OR 
    (
      has_role(auth.uid(), 'student'::app_role) AND
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'student'::app_role 
        AND is_active = true
      ) AND
      EXISTS (
        SELECT 1 FROM student_enrollments
        WHERE student_id = auth.uid() 
        AND course_id = course_videos.course_id
      )
    )
  )
);

-- Drop existing policy for students viewing enrollments
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.student_enrollments;

-- Recreate policy with is_active check
CREATE POLICY "Students can view their own enrollments" 
ON public.student_enrollments 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND 
  (
    has_role(auth.uid(), 'admin'::app_role) OR 
    (
      student_id = auth.uid() AND
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'student'::app_role 
        AND is_active = true
      )
    )
  )
);

-- Drop existing policies for video progress
DROP POLICY IF EXISTS "Students can view their own progress" ON public.video_progress;
DROP POLICY IF EXISTS "Students can insert their own progress" ON public.video_progress;
DROP POLICY IF EXISTS "Students can update their own progress" ON public.video_progress;

-- Recreate policies with is_active check
CREATE POLICY "Students can view their own progress" 
ON public.video_progress 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND 
  (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'student'::app_role 
      AND is_active = true
    )
  )
);

CREATE POLICY "Students can insert their own progress" 
ON public.video_progress 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  student_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'student'::app_role 
    AND is_active = true
  )
);

CREATE POLICY "Students can update their own progress" 
ON public.video_progress 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL) AND 
  student_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'student'::app_role 
    AND is_active = true
  )
);