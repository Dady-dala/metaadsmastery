-- Remove the foreign key constraint on notifications.user_id
-- This allows notifications to reference user_roles.user_id which references auth.users
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;