-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view warehouse addresses of stores they order from" ON addresses;
DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;

-- Recreate with comprehensive access for addresses
CREATE POLICY "Users can view addresses based on orders and ownership" 
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
  OR
  -- Allow store owners to view warehouse addresses of their customers (retailers who ordered from them)
  id IN (
    SELECT s2.warehouse_address_id
    FROM stores s1
    INNER JOIN orders o ON o.store_id = s1.id
    INNER JOIN stores s2 ON s2.owner_id = o.customer_id
    WHERE s1.owner_id = auth.uid()
    AND s2.warehouse_address_id IS NOT NULL
  )
  OR
  -- Allow store owners to view delivery addresses of orders placed to their stores
  id IN (
    SELECT o.delivery_address_id
    FROM orders o
    INNER JOIN stores s ON s.id = o.store_id
    WHERE s.owner_id = auth.uid()
    AND o.delivery_address_id IS NOT NULL
  )
);
