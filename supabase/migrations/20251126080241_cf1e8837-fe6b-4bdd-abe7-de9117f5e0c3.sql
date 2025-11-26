-- Add scheduled_at field to email_campaigns table
ALTER TABLE public.email_campaigns 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;

-- Add comment
COMMENT ON COLUMN public.email_campaigns.scheduled_at IS 'Date et heure de programmation de la campagne. NULL = manuel ou immédiat';