-- Fix the handle_new_user function to use correct role types
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  role_value text;
BEGIN
  -- Get role from metadata as text, default to customer
  role_value := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
  
  -- Insert into profiles (uses user_role type)
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    role_value::user_role
  );
  
  -- Insert into user_roles (uses app_role type)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, role_value::app_role);
  
  RETURN NEW;
END;
$function$;