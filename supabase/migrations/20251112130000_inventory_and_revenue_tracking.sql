-- Add revenue tracking column to stores table if it doesn't exist
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(12, 2) DEFAULT 0;

-- Function to reduce inventory and update revenue when order is confirmed
CREATE OR REPLACE FUNCTION handle_order_confirmation()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  store_revenue NUMERIC(12, 2);
BEGIN
  -- Handle INSERT (new orders with payment_status = 'paid' or 'cod')
  IF TG_OP = 'INSERT' AND (NEW.payment_status = 'paid' OR NEW.payment_status = 'cod') THEN
    
    -- Calculate total revenue for this order
    store_revenue := NEW.total;
    
    -- Update store revenue
    UPDATE stores 
    SET total_revenue = COALESCE(total_revenue, 0) + store_revenue,
        updated_at = NOW()
    WHERE id = NEW.store_id;
    
    -- Reduce inventory for each order item
    FOR item IN 
      SELECT inventory_id, qty 
      FROM order_items 
      WHERE order_id = NEW.id
    LOOP
      -- Reduce stock quantity
      UPDATE inventory 
      SET stock_qty = GREATEST(0, stock_qty - item.qty),
          updated_at = NOW()
      WHERE id = item.inventory_id;
    END LOOP;
    
  -- Handle UPDATE (status change to confirmed or payment completed)
  ELSIF TG_OP = 'UPDATE' AND 
        (NEW.status = 'confirmed' OR NEW.payment_status = 'paid' OR NEW.payment_status = 'cod') AND 
        (OLD.status != 'confirmed' AND OLD.payment_status NOT IN ('paid', 'cod')) THEN
    
    -- Calculate total revenue for this order
    store_revenue := NEW.total;
    
    -- Update store revenue
    UPDATE stores 
    SET total_revenue = COALESCE(total_revenue, 0) + store_revenue,
        updated_at = NOW()
    WHERE id = NEW.store_id;
    
    -- Reduce inventory for each order item
    FOR item IN 
      SELECT inventory_id, qty 
      FROM order_items 
      WHERE order_id = NEW.id
    LOOP
      -- Reduce stock quantity
      UPDATE inventory 
      SET stock_qty = GREATEST(0, stock_qty - item.qty),
          updated_at = NOW()
      WHERE id = item.inventory_id;
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for order confirmation (handles both INSERT and UPDATE)
DROP TRIGGER IF EXISTS trigger_order_confirmation ON orders;
CREATE TRIGGER trigger_order_confirmation
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_confirmation();

-- Function to handle order cancellation (restore inventory)
CREATE OR REPLACE FUNCTION handle_order_cancellation()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  store_revenue NUMERIC(12, 2);
BEGIN
  -- Only process when order is cancelled
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    
    -- If order was previously confirmed/paid, restore inventory and deduct revenue
    IF OLD.status = 'confirmed' OR OLD.payment_status = 'paid' THEN
      
      -- Calculate revenue to deduct
      store_revenue := NEW.total;
      
      -- Deduct from store revenue
      UPDATE stores 
      SET total_revenue = GREATEST(0, COALESCE(total_revenue, 0) - store_revenue),
          updated_at = NOW()
      WHERE id = NEW.store_id;
      
      -- Restore inventory for each order item
      FOR item IN 
        SELECT inventory_id, qty 
        FROM order_items 
        WHERE order_id = NEW.id
      LOOP
        -- Add stock back
        UPDATE inventory 
        SET stock_qty = stock_qty + item.qty,
            updated_at = NOW()
        WHERE id = item.inventory_id;
      END LOOP;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for order cancellation
DROP TRIGGER IF EXISTS trigger_order_cancellation ON orders;
CREATE TRIGGER trigger_order_cancellation
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_cancellation();

-- Add comment
COMMENT ON COLUMN stores.total_revenue IS 'Total revenue earned by the store from confirmed orders';
