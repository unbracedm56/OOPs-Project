-- Fix the handle_new_store_owner function to properly cast user_role to store_type
CREATE OR REPLACE FUNCTION public.handle_new_store_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only create store if user is retailer or wholesaler
  IF NEW.role IN ('retailer', 'wholesaler') THEN
    INSERT INTO public.stores (owner_id, name, type, is_active)
    VALUES (
      NEW.id,
      NEW.full_name || '''s Store',
      NEW.role::text::store_type,  -- Cast through text to convert between enum types
      true
    );
  END IF;
  RETURN NEW;
END;
$function$;