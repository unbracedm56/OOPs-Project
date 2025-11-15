-- Allow customers to update their own orders with proxy data during checkout
-- This is needed when the checkout process adds needs_proxy_approval and proxy_order_data

DROP POLICY IF EXISTS "Customers can update own orders for proxy data" ON public.orders;

CREATE POLICY "Customers can update own orders for proxy data"
ON public.orders
FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);
