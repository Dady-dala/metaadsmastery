-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create video_notes table for students to take notes during videos
CREATE TABLE public.video_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  video_id UUID NOT NULL,
  note_content TEXT NOT NULL,
  timestamp_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT video_notes_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.course_videos(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.video_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for video notes
CREATE POLICY "Students can view their own notes" 
ON public.video_notes 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own notes" 
ON public.video_notes 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own notes" 
ON public.video_notes 
FOR UPDATE 
USING (auth.uid() = student_id);

CREATE POLICY "Students can delete their own notes" 
ON public.video_notes 
FOR DELETE 
USING (auth.uid() = student_id);

-- Create index for better performance
CREATE INDEX idx_video_notes_student_video ON public.video_notes(student_id, video_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_video_notes_updated_at
BEFORE UPDATE ON public.video_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();