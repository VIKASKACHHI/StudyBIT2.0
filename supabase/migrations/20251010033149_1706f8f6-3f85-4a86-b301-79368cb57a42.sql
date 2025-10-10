-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new restrictive policy that allows:
-- 1. Users to view their own profile
-- 2. Admins to view all profiles (needed for admin dashboard to show uploader emails)
CREATE POLICY "Users can view own profile and admins can view all"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR is_admin(auth.uid())
);