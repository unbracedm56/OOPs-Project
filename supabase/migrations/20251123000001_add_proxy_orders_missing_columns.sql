-- Add missing columns to proxy_orders table

-- Add wholesaler_order_id to link to the normal order created to wholesaler
ALTER TABLE proxy_orders 
ADD COLUMN IF NOT EXISTS wholesaler_order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- Add delivery days tracking
ALTER TABLE proxy_orders 
ADD COLUMN IF NOT EXISTS wholesaler_delivery_days INTEGER DEFAULT 3;

ALTER TABLE proxy_orders 
ADD COLUMN IF NOT EXISTS retailer_delivery_days INTEGER DEFAULT 3;

-- Create index for faster lookup of wholesaler orders
CREATE INDEX IF NOT EXISTS idx_proxy_orders_wholesaler_order ON proxy_orders(wholesaler_order_id);

-- Add comment for clarity
COMMENT ON COLUMN proxy_orders.wholesaler_order_id IS 'Links to the normal order created from retailer to wholesaler';
COMMENT ON COLUMN proxy_orders.wholesaler_delivery_days IS 'Days for wholesaler to deliver to retailer';
COMMENT ON COLUMN proxy_orders.retailer_delivery_days IS 'Days for retailer to deliver to customer';
