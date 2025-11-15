-- Add fields to track proxy order requirements on main orders table
-- This allows retailer to review orders needing proxy fulfillment before creating wholesaler orders

DO $$ 
BEGIN
  -- Flag to indicate this order needs retailer to approve proxy fulfillment
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='needs_proxy_approval') THEN
    ALTER TABLE orders ADD COLUMN needs_proxy_approval BOOLEAN DEFAULT false;
  END IF;
  
  -- Store proxy order details as JSON until retailer approves
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='proxy_order_data') THEN
    ALTER TABLE orders ADD COLUMN proxy_order_data JSONB;
  END IF;
  
  -- Timestamp when retailer approved the proxy order
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='proxy_approved_at') THEN
    ALTER TABLE orders ADD COLUMN proxy_approved_at TIMESTAMPTZ;
  END IF;
END $$;

-- Update RLS policies to prevent customers from seeing proxy orders
DROP POLICY IF EXISTS "Customers can view their proxy orders" ON public.proxy_orders;

-- Wholesalers should only see proxy orders that are PAID (retailer has paid)
DROP POLICY IF EXISTS "Wholesalers can view proxy orders for their store" ON public.proxy_orders;

CREATE POLICY "Wholesalers can view paid proxy orders"
  ON proxy_orders FOR SELECT
  USING (
    wholesaler_store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
    AND payment_status = 'paid'
  );

-- Add comment explaining the flow
COMMENT ON COLUMN orders.needs_proxy_approval IS 'True when order contains items exceeding retailer stock, requiring retailer to approve and pay for wholesaler order';
COMMENT ON COLUMN orders.proxy_order_data IS 'JSON data about required proxy orders, stored until retailer approves';
