-- Add INSERT policy for order_items table
-- Allow customers to insert order items for their own orders
CREATE POLICY "Customers can insert order items for their orders"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  order_id IN (
    SELECT id FROM orders WHERE customer_id = auth.uid()
  )
);