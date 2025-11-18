-- Create table for contact form submissions
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (public form)
CREATE POLICY "Anyone can submit contact form"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Create policy to allow only authenticated users to view submissions (for admin)
CREATE POLICY "Only authenticated users can view submissions"
ON public.contact_submissions
FOR SELECT
TO authenticated
USING (true);

-- Add index for email lookups
CREATE INDEX idx_contact_submissions_email ON public.contact_submissions(email);
CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);