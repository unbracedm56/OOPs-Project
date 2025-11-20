-- Fix user_roles INSERT policy to allow new user registration
-- The handle_new_user trigger needs to insert into user_roles for new signups

-- Drop existing admin-only policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Allow service role (used by triggers) to manage all roles
CREATE POLICY "Service role can manage roles"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow admins to manage all roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow users to insert their own role during signup (used by handle_new_user trigger)
CREATE POLICY "Users can insert own role on signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
