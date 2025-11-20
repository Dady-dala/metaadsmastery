-- Add is_certifying column to courses table
ALTER TABLE public.courses 
ADD COLUMN is_certifying boolean NOT NULL DEFAULT true;

-- Add comment to clarify the purpose
COMMENT ON COLUMN public.courses.is_certifying IS 'Indique si ce cours délivre un certificat de réussite à la fin';