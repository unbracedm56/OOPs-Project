-- Add delivery_days to inventory table
ALTER TABLE public.inventory 
ADD COLUMN delivery_days integer DEFAULT 3;

-- Update RLS policies for proper tier-based access
DROP POLICY IF EXISTS "Everyone can view active inventory" ON public.inventory;

-- Consumers see only retailer inventory
CREATE POLICY "Consumers can view retailer inventory"
ON public.inventory
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND store_id IN (
    SELECT id FROM public.stores 
    WHERE type = 'retailer' AND is_active = true
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'customer'
  )
);

-- Retailers see only wholesaler inventory for purchasing
CREATE POLICY "Retailers can view wholesaler inventory"
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
    WHERE id = auth.uid() AND role = 'retailer'
  )
);

-- Retailers can view their own inventory
CREATE POLICY "Retailers can view own inventory"
ON public.inventory
FOR SELECT
TO authenticated
USING (
  store_id IN (
    SELECT s.id FROM public.stores s
    WHERE s.owner_id = auth.uid() AND s.type = 'retailer'
  )
);

-- Wholesalers can view their own inventory
CREATE POLICY "Wholesalers can view own inventory"
ON public.inventory
FOR SELECT
TO authenticated
USING (
  store_id IN (
    SELECT s.id FROM public.stores s
    WHERE s.owner_id = auth.uid() AND s.type = 'wholesaler'
  )
);

-- Create order tracking table for retailer-wholesaler transactions
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  buyer_store_id uuid REFERENCES public.stores(id) NOT NULL,
  seller_store_id uuid REFERENCES public.stores(id) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- RLS for purchase_orders
CREATE POLICY "Store owners can view their purchase orders"
ON public.purchase_orders
FOR SELECT
USING (
  buyer_store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  OR seller_store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
);

CREATE POLICY "Retailers can create purchase orders"
ON public.purchase_orders
FOR INSERT
WITH CHECK (
  buyer_store_id IN (
    SELECT id FROM public.stores 
    WHERE owner_id = auth.uid() AND type = 'retailer'
  )
);