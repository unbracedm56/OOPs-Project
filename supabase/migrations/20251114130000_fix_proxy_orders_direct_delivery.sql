-- Fix proxy orders to deliver directly to customer (not add to retailer inventory)
-- This ensures proxy order stock goes directly to the customer, not retailer's inventory

-- Drop the old trigger if exists
DROP TRIGGER IF EXISTS trigger_transfer_proxy_stock ON proxy_orders;
DROP FUNCTION IF EXISTS transfer_proxy_order_stock();

-- Recreate the stock transfer function to handle wholesaler delivery to retailer
CREATE OR REPLACE FUNCTION transfer_proxy_order_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- When wholesaler marks as delivered to retailer (status='delivered_to_retailer')
  IF NEW.status = 'delivered_to_retailer' AND OLD.status != 'delivered_to_retailer' AND NEW.stock_transferred = false THEN
    
    -- Reduce wholesaler's inventory
    UPDATE inventory
    SET stock_qty = stock_qty - NEW.qty,
        updated_at = NOW()
    WHERE id = NEW.inventory_id
    AND stock_qty >= NEW.qty; -- Safety check
    
    -- Check if update was successful
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock in wholesaler inventory';
    END IF;
    
    -- DO NOT add to retailer inventory - this stock goes directly to customer
    -- The stock is now "in transit" from wholesaler -> retailer -> customer
    
    -- Mark stock as transferred from wholesaler
    NEW.stock_transferred := true;
    NEW.transferred_at := NOW();
    
  END IF;
  
  -- When retailer delivers to customer (status='completed')
  -- This happens after retailer updates customer order status to delivered
  IF NEW.status = 'completed' AND OLD.status = 'delivered_to_retailer' THEN
    -- Stock has been delivered to customer, nothing else to do
    -- Retailer has fulfilled their delivery obligation
    NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER trigger_transfer_proxy_stock
  BEFORE UPDATE ON proxy_orders
  FOR EACH ROW
  EXECUTE FUNCTION transfer_proxy_order_stock();

-- Add delivery tracking fields to proxy_orders (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='proxy_orders' AND column_name='wholesaler_delivery_days') THEN
    ALTER TABLE proxy_orders ADD COLUMN wholesaler_delivery_days INTEGER DEFAULT 3;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='proxy_orders' AND column_name='retailer_delivery_days') THEN
    ALTER TABLE proxy_orders ADD COLUMN retailer_delivery_days INTEGER DEFAULT 3;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='proxy_orders' AND column_name='estimated_delivery_date') THEN
    ALTER TABLE proxy_orders ADD COLUMN estimated_delivery_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='proxy_orders' AND column_name='cancelled_by') THEN
    ALTER TABLE proxy_orders ADD COLUMN cancelled_by TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='proxy_orders' AND column_name='cancelled_at') THEN
    ALTER TABLE proxy_orders ADD COLUMN cancelled_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='proxy_orders' AND column_name='cancellation_reason') THEN
    ALTER TABLE proxy_orders ADD COLUMN cancellation_reason TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='proxy_orders' AND column_name='delivered_to_retailer_at') THEN
    ALTER TABLE proxy_orders ADD COLUMN delivered_to_retailer_at TIMESTAMPTZ;
  END IF;
END $$;

-- Drop the computed column if it exists (computed columns can't be added conditionally)
DO $$
BEGIN
  ALTER TABLE proxy_orders DROP COLUMN IF EXISTS total_delivery_days;
  ALTER TABLE proxy_orders ADD COLUMN total_delivery_days INTEGER GENERATED ALWAYS AS (wholesaler_delivery_days + retailer_delivery_days) STORED;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Update proxy_order_status enum to include new status (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'delivered_to_retailer' 
                 AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'proxy_order_status')) THEN
    ALTER TYPE proxy_order_status ADD VALUE 'delivered_to_retailer';
  END IF;
END $$;

-- Add tracking for which order items are from proxy orders
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='order_items' AND column_name='from_proxy_order') THEN
    ALTER TABLE order_items ADD COLUMN from_proxy_order BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='order_items' AND column_name='proxy_order_id') THEN
    ALTER TABLE order_items ADD COLUMN proxy_order_id UUID REFERENCES proxy_orders(id);
  END IF;
END $$;

-- Create index for faster proxy order item lookups (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_order_items_proxy_order') THEN
    CREATE INDEX idx_order_items_proxy_order ON order_items(proxy_order_id) WHERE proxy_order_id IS NOT NULL;
  END IF;
END $$;
