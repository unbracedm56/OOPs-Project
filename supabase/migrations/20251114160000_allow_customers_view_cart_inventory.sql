-- Allow customers to see inventory rows referenced in their cart to prevent 406 errors

DROP POLICY IF EXISTS "Customers can view cart inventory" ON public.inventory;

CREATE POLICY "Customers can view cart inventory"
ON public.inventory
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM cart_items ci
    JOIN cart c ON c.id = ci.cart_id
    WHERE ci.inventory_id = public.inventory.id
      AND c.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'customer'
  )
);
