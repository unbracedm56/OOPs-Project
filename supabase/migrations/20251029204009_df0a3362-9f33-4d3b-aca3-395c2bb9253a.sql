
-- Create function to automatically create store for retailers and wholesalers
CREATE OR REPLACE FUNCTION public.handle_new_store_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create store if user is retailer or wholesaler
  IF NEW.role IN ('retailer', 'wholesaler') THEN
    INSERT INTO public.stores (owner_id, name, type, is_active)
    VALUES (
      NEW.id,
      NEW.full_name || '''s Store',
      NEW.role::store_type,
      true
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to run after profile insert
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_store_owner();

-- Update RLS policy for retailers to only see wholesaler products NOT in their inventory
DROP POLICY IF EXISTS "Retailers can view wholesaler inventory" ON public.inventory;
CREATE POLICY "Retailers can view wholesaler inventory"
ON public.inventory
FOR SELECT
USING (
  is_active = true 
  AND store_id IN (
    SELECT id FROM stores 
    WHERE type = 'wholesaler' 
    AND is_active = true
  )
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'retailer'
  )
  -- Exclude products already in retailer's inventory
  AND product_id NOT IN (
    SELECT product_id 
    FROM inventory 
    WHERE store_id IN (
      SELECT id FROM stores 
      WHERE owner_id = auth.uid() 
      AND type = 'retailer'
    )
  )
);
