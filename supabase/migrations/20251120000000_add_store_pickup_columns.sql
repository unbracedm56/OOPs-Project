-- Add store pickup columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS is_store_pickup BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pickup_date DATE,
ADD COLUMN IF NOT EXISTS pickup_store_id UUID REFERENCES stores(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_pickup_store_id ON orders(pickup_store_id);
CREATE INDEX IF NOT EXISTS idx_orders_is_store_pickup ON orders(is_store_pickup) WHERE is_store_pickup = true;

-- Add comment for documentation
COMMENT ON COLUMN orders.is_store_pickup IS 'Indicates if this order is for store pickup instead of home delivery';
COMMENT ON COLUMN orders.pickup_date IS 'Date when customer will pick up the order from store';
COMMENT ON COLUMN orders.pickup_store_id IS 'Store ID where customer will pick up the order (same as store_id for customer orders)';
