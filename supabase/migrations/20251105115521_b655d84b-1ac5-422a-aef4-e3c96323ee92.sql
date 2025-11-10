-- Step 1: Create enum for roles (if not exists, will error if exists but that's ok)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('customer', 'retailer', 'wholesaler', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create user_roles table for secure role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::text::app_role
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
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

-- Step 5: Create security definer function to get user role (for dashboard routing)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Step 6: Create security definer function for safe profile viewing (only necessary fields)
CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, full_name, avatar_url
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Step 7: Update profiles table RLS policies - restrict to own profile only
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile (except role)"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Step 8: Remove role column from profiles UPDATE operations by creating trigger
CREATE OR REPLACE FUNCTION public.prevent_role_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent any changes to role column
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Direct role updates are not allowed. Contact administrator.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_role_update ON public.profiles;
CREATE TRIGGER prevent_profile_role_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_update();

-- Step 9: Update handle_new_user to also populate user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from metadata, default to customer
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'customer'::app_role);
  
  -- Insert into profiles
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    user_role
  );
  
  -- Insert into user_roles (secure table)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$function$;

-- Step 10: Fix feedback moderation - prevent users from publishing their own reviews
DROP POLICY IF EXISTS "Users can create feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can update own feedback" ON public.feedback;

CREATE POLICY "Users can create unpublished feedback"
ON public.feedback
FOR INSERT
WITH CHECK (
  auth.uid() = author_id 
  AND is_published = false
);

CREATE POLICY "Users can update own unpublished feedback"
ON public.feedback
FOR UPDATE
USING (
  auth.uid() = author_id 
  AND is_published = false
)
WITH CHECK (
  auth.uid() = author_id 
  AND is_published = false
);

-- Admins can publish/moderate feedback
CREATE POLICY "Admins can manage all feedback"
ON public.feedback
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Step 11: RLS policy for user_roles - users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can insert/update/delete roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));