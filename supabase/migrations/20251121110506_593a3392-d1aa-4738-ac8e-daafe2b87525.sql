-- Add text_color column to certificate_settings table
ALTER TABLE public.certificate_settings
ADD COLUMN text_color text NOT NULL DEFAULT '#FFFFFF';