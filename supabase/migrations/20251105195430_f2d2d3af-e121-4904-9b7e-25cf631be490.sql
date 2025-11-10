-- Update handle_new_user to properly detect OAuth signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  role_value text;
  provider_type text;
BEGIN
  -- Get the auth provider (email, google, etc.)
  provider_type := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  
  -- Only auto-assign role for email signups, not OAuth
  IF provider_type = 'email' THEN
    role_value := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
    
    -- Insert into profiles with role
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
      role_value::user_role
    );
    
    -- Insert into user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, role_value::app_role);
  ELSE
    -- OAuth signup - create profile WITHOUT role
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
      'customer'::user_role  -- Set default to avoid NOT NULL constraint
    );
    -- Do NOT insert into user_roles table for OAuth users
  END IF;
  
  RETURN NEW;
END;
$$;