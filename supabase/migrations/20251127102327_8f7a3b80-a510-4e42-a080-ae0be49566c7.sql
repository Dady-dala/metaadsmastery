-- Enable realtime for landing_page_sections table
ALTER TABLE public.landing_page_sections REPLICA IDENTITY FULL;

-- Add the table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.landing_page_sections;