-- Drop the old trigger on orders table for inventory reduction
-- Keep only revenue tracking on orders table

CREATE OR REPLACE FUNCTION handle_order_confirmation()
RETURNS TRIGGER AS $$
DECLARE
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
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New function to reduce inventory when order items are inserted
CREATE OR REPLACE FUNCTION reduce_inventory_on_order_item()
RETURNS TRIGGER AS $$
DECLARE
  order_payment_status TEXT;
BEGIN
  -- Get the payment status of the order
  SELECT payment_status INTO order_payment_status
  FROM orders
  WHERE id = NEW.order_id;
  
  -- Only reduce inventory if payment is confirmed (paid or cod)
  IF order_payment_status IN ('paid', 'cod') THEN
    -- Reduce stock quantity
    UPDATE inventory 
    SET stock_qty = GREATEST(0, stock_qty - NEW.qty),
        updated_at = NOW()
    WHERE id = NEW.inventory_id;
    
    RAISE NOTICE 'Reduced inventory % by qty %', NEW.inventory_id, NEW.qty;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on order_items table
DROP TRIGGER IF EXISTS trigger_reduce_inventory ON order_items;
CREATE TRIGGER trigger_reduce_inventory
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION reduce_inventory_on_order_item();

-- Backfill: Reduce inventory for existing COD orders
DO $$
DECLARE
  item RECORD;
BEGIN
  FOR item IN 
    SELECT oi.inventory_id, oi.qty
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.payment_status = 'cod'
  LOOP
    UPDATE inventory 
    SET stock_qty = GREATEST(0, stock_qty - item.qty),
        updated_at = NOW()
    WHERE id = item.inventory_id;
    
    RAISE NOTICE 'Backfilled inventory reduction for inventory_id: %', item.inventory_id;
  END LOOP;
END $$;
