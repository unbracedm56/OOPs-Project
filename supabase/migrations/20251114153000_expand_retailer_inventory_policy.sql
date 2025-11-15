-- Allow retailers to view wholesaler inventory tied to their past orders
-- while keeping browsing exclusions in place

DROP POLICY IF EXISTS "Retailers can view wholesaler inventory" ON public.inventory;

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

CREATE OR REPLACE FUNCTION public.inventory_in_retailer_orders(p_user uuid, p_inventory uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.inventory_id = p_inventory
      AND o.customer_id = p_user
  );
$$;

REVOKE ALL ON FUNCTION public.inventory_in_retailer_orders(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inventory_in_retailer_orders(uuid, uuid) TO authenticated;

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
    OR public.inventory_in_retailer_orders(auth.uid(), id)
  )
);
