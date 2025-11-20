-- Drop the broad ALL policy and replace with explicit policies for each operation
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

-- Admins can insert new role assignments
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update role assignments
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete role assignments
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));