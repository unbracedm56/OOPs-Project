-- Allow customers to view wholesaler inventory for proxy order system
-- This enables the feature where customers can order beyond retailer stock

-- Drop existing policy if it exists, then recreate it
DROP POLICY IF EXISTS "Customers can view wholesaler inventory for proxy orders" ON public.inventory;

-- Add new policy for customers to view wholesaler inventory
CREATE POLICY "Customers can view wholesaler inventory for proxy orders"
ON public.inventory
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND store_id IN (
    SELECT id FROM public.stores 
    WHERE type = 'wholesaler' AND is_active = true
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'customer'
  )
);
