-- Add public_title and public_description to forms table
ALTER TABLE public.forms 
ADD COLUMN public_title TEXT,
ADD COLUMN public_description TEXT;

-- Set default values for existing forms
UPDATE public.forms 
SET public_title = title, 
    public_description = description
WHERE public_title IS NULL;