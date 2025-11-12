-- Backfill revenue and inventory for existing paid orders
DO $$
DECLARE
  order_record RECORD;
  item RECORD;
  store_revenue NUMERIC(12, 2);
BEGIN
  -- Process all orders that are paid or COD but haven't been processed
  FOR order_record IN 
    SELECT * FROM orders 
    WHERE payment_status IN ('paid', 'cod')
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
    
    RAISE NOTICE 'Processed order: % with revenue: %', order_record.order_number, store_revenue;
  END LOOP;
END $$;
