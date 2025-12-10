-- Drop old constraint and add new one with all valid statuses
ALTER TABLE email_campaign_logs DROP CONSTRAINT IF EXISTS email_campaign_logs_status_check;

ALTER TABLE email_campaign_logs ADD CONSTRAINT email_campaign_logs_status_check 
CHECK (status = ANY (ARRAY['pending', 'sent', 'delivered', 'failed', 'bounced', 'complained']::text[]));