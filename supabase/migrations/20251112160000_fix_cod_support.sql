-- Update trigger function to support COD payment method
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

-- Backfill COD orders that were missed
DO $$
DECLARE
  order_record RECORD;
  item RECORD;
  store_revenue NUMERIC(12, 2);
BEGIN
  -- Process all COD orders that haven't been processed yet
  FOR order_record IN 
    SELECT * FROM orders 
    WHERE payment_status = 'cod'
    ORDER BY created_at ASC
  LOOP
    -- Calculate revenue
    store_revenue := order_record.total;
    
    -- Update store revenue
    UPDATE stores 
    SET total_revenue = COALESCE(total_revenue, 0) + store_revenue,
        updated_at = NOW()
    WHERE id = order_record.store_id;
    
    -- Reduce inventory for each order item
    FOR item IN 
      SELECT inventory_id, qty 
      FROM order_items 
      WHERE order_id = order_record.id
    LOOP
      -- Reduce stock quantity
      UPDATE inventory 
      SET stock_qty = GREATEST(0, stock_qty - item.qty),
          updated_at = NOW()
      WHERE id = item.inventory_id;
    END LOOP;
    
    RAISE NOTICE 'Processed COD order: % with revenue: %', order_record.order_number, store_revenue;
  END LOOP;
END $$;
