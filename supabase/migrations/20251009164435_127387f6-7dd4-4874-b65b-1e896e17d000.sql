-- Add super_admin role support and enhanced permissions

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = is_super_admin.user_id
    AND role = 'super_admin'
  );
$$;

-- Allow super admins to manage user roles
CREATE POLICY "Super admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (is_super_admin(auth.uid()));

-- Allow admins to delete materials
CREATE POLICY "Admins can delete materials"
ON public.materials
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Allow admins to update approved materials
DROP POLICY IF EXISTS "Admins can update any material" ON public.materials;
CREATE POLICY "Admins can update any material"
ON public.materials
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

-- Update browse policy to allow public access to approved materials
DROP POLICY IF EXISTS "Anyone can view approved materials" ON public.materials;
CREATE POLICY "Anyone can view approved materials"
ON public.materials
FOR SELECT
USING (status = 'approved'::upload_status OR uploaded_by = auth.uid() OR is_admin(auth.uid()));