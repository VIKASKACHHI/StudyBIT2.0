-- Create enum for upload status
CREATE TYPE public.upload_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for material type
CREATE TYPE public.material_type AS ENUM ('pyq', 'notes');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view roles"
  ON public.user_roles FOR SELECT
  USING (true);

-- Security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = is_admin.user_id
    AND role = 'admin'
  );
$$;

-- Create materials table
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  year TEXT,
  semester TEXT,
  material_type material_type NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  status upload_status NOT NULL DEFAULT 'pending',
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Students can view approved materials
CREATE POLICY "Anyone can view approved materials"
  ON public.materials FOR SELECT
  USING (status = 'approved' OR uploaded_by = auth.uid() OR public.is_admin(auth.uid()));

-- Students can upload materials
CREATE POLICY "Authenticated users can upload materials"
  ON public.materials FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

-- Students can update their own pending materials
CREATE POLICY "Users can update own pending materials"
  ON public.materials FOR UPDATE
  USING (auth.uid() = uploaded_by AND status = 'pending');

-- Admins can update any material
CREATE POLICY "Admins can update any material"
  ON public.materials FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Create storage bucket for materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', false);

-- Storage policies
CREATE POLICY "Authenticated users can upload materials"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'materials' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view approved material files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'materials' AND
    (
      -- Check if the material is approved
      EXISTS (
        SELECT 1 FROM public.materials
        WHERE materials.file_path = storage.objects.name
        AND materials.status = 'approved'
      )
      OR
      -- Or if user uploaded it
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      -- Or if user is admin
      public.is_admin(auth.uid())
    )
  );

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign student role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();