-- Fix 406 error when retailers view their cart
-- The issue is that when retailers buy from their own store, 
-- the inventory RLS check can cause issues with cart_items queries

-- Add a simple policy to allow viewing inventory that's in the user's cart
-- This bypasses the complex retailer checks when just viewing cart

DROP POLICY IF EXISTS "Users can view inventory in their cart" ON public.inventory;

CREATE POLICY "Users can view inventory in their cart"
ON public.inventory
FOR SELECT
USING (
  id IN (
    SELECT ci.inventory_id
    FROM cart_items ci
    JOIN cart c ON c.id = ci.cart_id
    WHERE c.user_id = auth.uid()
  )
);
