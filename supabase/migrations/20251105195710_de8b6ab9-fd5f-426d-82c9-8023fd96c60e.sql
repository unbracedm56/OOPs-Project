-- Update prevent_role_update to allow first-time role assignment
CREATE OR REPLACE FUNCTION public.prevent_role_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow role changes if user doesn't have a role assigned yet (first-time setup)
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;
  
  -- Prevent any changes to role column for users who already have a role
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Direct role updates are not allowed. Contact administrator.';
  END IF;
  
  RETURN NEW;
END;
$$;