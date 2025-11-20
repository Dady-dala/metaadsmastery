-- Create quizzes table
CREATE TABLE public.quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  passing_score integer NOT NULL DEFAULT 70,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create quiz_questions table
CREATE TABLE public.quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
  options jsonb,
  correct_answer text NOT NULL,
  points integer NOT NULL DEFAULT 1,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create quiz_attempts table
CREATE TABLE public.quiz_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  answers jsonb NOT NULL
);

-- Create certificates table
CREATE TABLE public.certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  issued_at timestamp with time zone NOT NULL DEFAULT now(),
  certificate_url text,
  UNIQUE(student_id, course_id)
);

-- Enable RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes
CREATE POLICY "Admins can manage quizzes"
  ON public.quizzes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view quizzes of enrolled courses"
  ON public.quizzes
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      (has_role(auth.uid(), 'student'::app_role) AND EXISTS (
        SELECT 1 FROM student_enrollments 
        WHERE student_id = auth.uid() AND course_id = quizzes.course_id
      ))
    )
  );

-- RLS Policies for quiz_questions
CREATE POLICY "Admins can manage quiz questions"
  ON public.quiz_questions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view quiz questions of enrolled courses"
  ON public.quiz_questions
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      (has_role(auth.uid(), 'student'::app_role) AND EXISTS (
        SELECT 1 FROM quizzes q
        JOIN student_enrollments se ON se.course_id = q.course_id
        WHERE q.id = quiz_questions.quiz_id AND se.student_id = auth.uid()
      ))
    )
  );

-- RLS Policies for quiz_attempts
CREATE POLICY "Admins can view all quiz attempts"
  ON public.quiz_attempts
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their own quiz attempts"
  ON public.quiz_attempts
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND 
    student_id = auth.uid() AND
    has_role(auth.uid(), 'student'::app_role)
  );

CREATE POLICY "Students can insert their own quiz attempts"
  ON public.quiz_attempts
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    student_id = auth.uid() AND
    has_role(auth.uid(), 'student'::app_role)
  );

-- RLS Policies for certificates
CREATE POLICY "Admins can view all certificates"
  ON public.certificates
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their own certificates"
  ON public.certificates
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND 
    student_id = auth.uid() AND
    has_role(auth.uid(), 'student'::app_role)
  );

CREATE POLICY "Service role can insert certificates"
  ON public.certificates
  FOR INSERT
  WITH CHECK (false);

-- Create indexes for performance
CREATE INDEX idx_quizzes_course_id ON public.quizzes(course_id);
CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX idx_quiz_attempts_student_id ON public.quiz_attempts(student_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_certificates_student_id ON public.certificates(student_id);
CREATE INDEX idx_certificates_course_id ON public.certificates(course_id);