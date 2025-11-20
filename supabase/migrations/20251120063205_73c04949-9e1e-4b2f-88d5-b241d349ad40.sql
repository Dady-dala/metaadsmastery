-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Only admins can insert roles
CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Drop existing permissive policies on contact_messages
DROP POLICY IF EXISTS "Only authenticated users can view contact messages" ON public.contact_messages;

-- Create new restrictive policy for contact_messages
CREATE POLICY "Only admins can view contact messages"
ON public.contact_messages
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Drop existing permissive policies on contact_submissions
DROP POLICY IF EXISTS "Only authenticated users can view submissions" ON public.contact_submissions;

-- Create new restrictive policy for contact_submissions
CREATE POLICY "Only admins can view contact submissions"
ON public.contact_submissions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));