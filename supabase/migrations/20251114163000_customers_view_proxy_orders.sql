-- Allow customers to select proxy orders tied to their own purchases so inserts can return rows

DROP POLICY IF EXISTS "Customers can view their proxy orders" ON public.proxy_orders;

CREATE POLICY "Customers can view their proxy orders"
ON public.proxy_orders
FOR SELECT
USING (
  customer_order_id IN (
    SELECT id FROM public.orders
    WHERE customer_id = auth.uid()
  )
);
