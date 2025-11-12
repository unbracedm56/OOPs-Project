-- Add columns to track inventory source and purchase order
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS source_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'created' CHECK (source_type IN ('created', 'purchased'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_source_order ON inventory(source_order_id);

-- Add comments
COMMENT ON COLUMN inventory.source_order_id IS 'Order ID from which this inventory item was sourced (if purchased from wholesaler)';
COMMENT ON COLUMN inventory.source_type IS 'Source of inventory: created (by retailer) or purchased (from wholesaler)';
