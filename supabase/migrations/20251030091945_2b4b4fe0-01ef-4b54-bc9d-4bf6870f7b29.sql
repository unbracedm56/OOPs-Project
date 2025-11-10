-- Fix infinite recursion in inventory RLS policies

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Retailers can view wholesaler inventory" ON public.inventory;

-- Recreate the policy without the recursive self-reference
CREATE POLICY "Retailers can view wholesaler inventory"
ON public.inventory
FOR SELECT
USING (
  is_active = true 
  AND store_id IN (
    SELECT stores.id
    FROM stores
    WHERE stores.type = 'wholesaler'::store_type 
    AND stores.is_active = true
  )
  AND EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'retailer'::user_role
  )
);