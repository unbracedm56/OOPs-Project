-- Allow customers to view warehouse addresses of stores they have orders from
CREATE POLICY "Users can view warehouse addresses of stores they order from" 
ON addresses FOR SELECT 
USING (
  -- Allow if it's their own address
  auth.uid() = user_id 
  OR 
  -- Allow if it's a warehouse address of a store they have ordered from
  id IN (
    SELECT s.warehouse_address_id 
    FROM stores s
    INNER JOIN orders o ON o.store_id = s.id
    WHERE o.customer_id = auth.uid()
    AND s.warehouse_address_id IS NOT NULL
  )
  OR
  -- Allow if it's a warehouse address of a store owned by the current user
  id IN (
    SELECT warehouse_address_id 
    FROM stores 
    WHERE owner_id = auth.uid()
    AND warehouse_address_id IS NOT NULL
  )
);
