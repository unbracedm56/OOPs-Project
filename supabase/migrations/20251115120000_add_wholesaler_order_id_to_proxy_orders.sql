-- Add wholesaler_order_id to link proxy_orders to the actual order placed to wholesaler
-- This makes the system treat wholesaler fulfillment as normal orders

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='proxy_orders' AND column_name='wholesaler_order_id') THEN
    ALTER TABLE proxy_orders ADD COLUMN wholesaler_order_id UUID REFERENCES orders(id) ON DELETE CASCADE;
    CREATE INDEX idx_proxy_orders_wholesaler_order ON proxy_orders(wholesaler_order_id);
  END IF;
END $$;

-- Update the trigger to add stock to retailer inventory when wholesaler delivers
DROP TRIGGER IF EXISTS trigger_transfer_proxy_stock ON proxy_orders;
DROP FUNCTION IF EXISTS transfer_proxy_order_stock();

CREATE OR REPLACE FUNCTION transfer_proxy_order_stock()
RETURNS TRIGGER AS $$
DECLARE
  wholesaler_order_status TEXT;
BEGIN
  -- Check the status of the linked wholesaler order
  SELECT status INTO wholesaler_order_status
  FROM orders
  WHERE id = NEW.wholesaler_order_id;

  -- When wholesaler marks their order as delivered/shipped
  IF wholesaler_order_status IN ('delivered', 'shipped') AND NEW.stock_transferred = false THEN
    
    -- Add stock to retailer's inventory
    INSERT INTO inventory (
      store_id,
      product_id,
      stock_qty,
      price,
      mrp,
      is_active,
      delivery_days,
      source_type,
      source_order_id
    )
    SELECT 
      NEW.retailer_store_id,
      NEW.product_id,
      NEW.qty,
      wi.price * 1.1, -- Retailer can mark up price
      wi.mrp,
      true,
      COALESCE(wi.delivery_days, 3),
      'purchased',
      NEW.wholesaler_order_id
    FROM inventory wi
    WHERE wi.id = NEW.inventory_id
    ON CONFLICT (store_id, product_id)
    DO UPDATE SET
      stock_qty = inventory.stock_qty + NEW.qty,
      updated_at = NOW();
    
    -- Mark stock as transferred to retailer
    NEW.stock_transferred := true;
    NEW.transferred_at := NOW();
    NEW.status := 'delivered_to_retailer';
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_transfer_proxy_stock
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status IN ('delivered', 'shipped') AND OLD.status NOT IN ('delivered', 'shipped'))
  EXECUTE FUNCTION transfer_proxy_order_stock();

-- Actually, we need a different approach - trigger on orders table when wholesaler order status changes
DROP TRIGGER IF EXISTS trigger_transfer_proxy_stock ON orders;

-- Create a function that updates proxy_orders when wholesaler order is delivered
CREATE OR REPLACE FUNCTION update_proxy_on_wholesaler_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- When a wholesaler order is delivered, update related proxy orders
  IF NEW.status IN ('delivered', 'shipped') AND OLD.status NOT IN ('delivered', 'shipped') THEN
    
    -- Update all proxy orders linked to this wholesaler order
    UPDATE proxy_orders
    SET 
      status = 'delivered_to_retailer',
      stock_transferred = true,
      transferred_at = NOW()
    WHERE wholesaler_order_id = NEW.id
    AND stock_transferred = false;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_proxy_on_wholesaler_delivery
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status IN ('delivered', 'shipped') AND OLD.status NOT IN ('delivered', 'shipped'))
  EXECUTE FUNCTION update_proxy_on_wholesaler_delivery();

-- Create trigger on proxy_orders to add stock to retailer when status changes to delivered_to_retailer
CREATE OR REPLACE FUNCTION add_stock_to_retailer_on_proxy_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- When proxy order status changes to delivered_to_retailer, add stock to retailer
  IF NEW.status = 'delivered_to_retailer' AND OLD.status != 'delivered_to_retailer' THEN
    
    -- Add stock to retailer's inventory
    INSERT INTO inventory (
      store_id,
      product_id,
      stock_qty,
      price,
      mrp,
      is_active,
      delivery_days,
      source_type,
      source_order_id
    )
    SELECT 
      NEW.retailer_store_id,
      NEW.product_id,
      NEW.qty,
      wi.price * 1.1, -- Retailer can mark up price
      wi.mrp,
      true,
      COALESCE(wi.delivery_days, 3),
      'purchased',
      NEW.wholesaler_order_id
    FROM inventory wi
    WHERE wi.id = NEW.inventory_id
    ON CONFLICT (store_id, product_id)
    DO UPDATE SET
      stock_qty = inventory.stock_qty + NEW.qty,
      updated_at = NOW();
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_add_stock_to_retailer_on_proxy_delivery
  AFTER UPDATE ON proxy_orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered_to_retailer' AND OLD.status != 'delivered_to_retailer')
  EXECUTE FUNCTION add_stock_to_retailer_on_proxy_delivery();
