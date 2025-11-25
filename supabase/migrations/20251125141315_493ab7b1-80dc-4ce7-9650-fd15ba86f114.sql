-- Create email campaigns table
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'new_student', 'course_assigned', 'course_completed', 'inactivity', 'date_based', 'percentage_progress')),
  trigger_config JSONB DEFAULT '{}'::jsonb,
  target_audience JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create email campaign logs table
CREATE TABLE public.email_campaign_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaign_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_campaigns
CREATE POLICY "Admins can manage campaigns"
ON public.email_campaigns
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for email_campaign_logs
CREATE POLICY "Admins can view campaign logs"
ON public.email_campaign_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert logs"
ON public.email_campaign_logs
FOR INSERT
WITH CHECK (false);

-- Create trigger for updated_at
CREATE TRIGGER update_email_campaigns_updated_at
BEFORE UPDATE ON public.email_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_email_campaigns_trigger_type ON public.email_campaigns(trigger_type);
CREATE INDEX idx_email_campaign_logs_campaign_id ON public.email_campaign_logs(campaign_id);
CREATE INDEX idx_email_campaign_logs_student_id ON public.email_campaign_logs(student_id);
CREATE INDEX idx_email_campaign_logs_sent_at ON public.email_campaign_logs(sent_at);