-- Update RLS policy on contact_messages to block direct client inserts
-- Only allow inserts through Edge Function using service role

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;

-- Create new restrictive INSERT policy (only service role can insert)
CREATE POLICY "Only service role can insert contact messages"
ON public.contact_messages
FOR INSERT
WITH CHECK (false);