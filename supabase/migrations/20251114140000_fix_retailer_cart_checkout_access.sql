-- Fix RLS policy to allow retailers to view wholesaler inventory in their cart
-- Even if the product exists in their own inventory

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
  AND (
    -- Exclude products already in retailer's inventory (for browsing)
    product_id NOT IN (
      SELECT product_id 
      FROM inventory 
      WHERE store_id IN (
        SELECT id FROM stores 
        WHERE owner_id = auth.uid() 
        AND type = 'retailer'
      )
    )
    OR
    -- BUT allow if this inventory item is in their cart (for checkout)
    id IN (
      SELECT inventory_id
      FROM cart_items
      WHERE cart_id IN (
        SELECT id FROM cart
        WHERE user_id = auth.uid()
      )
    )
  )
);
