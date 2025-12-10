-- Add tracking columns to email_campaign_logs
ALTER TABLE public.email_campaign_logs 
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;

-- Create index for faster tracking queries
CREATE INDEX IF NOT EXISTS idx_email_campaign_logs_campaign_opened ON email_campaign_logs(campaign_id, opened_at);
CREATE INDEX IF NOT EXISTS idx_email_campaign_logs_campaign_clicked ON email_campaign_logs(campaign_id, clicked_at);