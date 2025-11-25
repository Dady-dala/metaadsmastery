-- Enable realtime for notifications table so admins receive instant notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;