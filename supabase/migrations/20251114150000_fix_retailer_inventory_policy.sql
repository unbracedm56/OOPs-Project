-- Resolve infinite recursion in retailer wholesaler inventory policy
-- Introduce helper functions to evaluate conditions without recursive RLS lookups

-- Drop problematic policy first
DROP POLICY IF EXISTS "Retailers can view wholesaler inventory" ON public.inventory;

-- Create helper function to check if retailer already owns product
CREATE OR REPLACE FUNCTION public.retailer_owns_product(p_user uuid, p_product uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM inventory inv
    JOIN stores s ON s.id = inv.store_id
    WHERE inv.product_id = p_product
      AND s.owner_id = p_user
      AND s.type = 'retailer'
  );
$$;

REVOKE ALL ON FUNCTION public.retailer_owns_product(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.retailer_owns_product(uuid, uuid) TO authenticated;

-- Create helper function to check if a wholesaler inventory item is present in retailer cart
CREATE OR REPLACE FUNCTION public.inventory_in_retailer_cart(p_user uuid, p_inventory uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cart_items ci
    JOIN cart c ON c.id = ci.cart_id
    WHERE ci.inventory_id = p_inventory
      AND c.user_id = p_user
  );
$$;

REVOKE ALL ON FUNCTION public.inventory_in_retailer_cart(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inventory_in_retailer_cart(uuid, uuid) TO authenticated;

-- Recreate policy using helper functions to avoid recursive references
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
  AND (
    NOT public.retailer_owns_product(auth.uid(), product_id)
    OR public.inventory_in_retailer_cart(auth.uid(), id)
  )
);
