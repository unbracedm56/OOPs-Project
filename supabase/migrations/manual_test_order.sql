-- Manual test: Process a specific COD order
-- Replace 'YOUR_ORDER_ID' with the actual order ID from your recent test

DO $$
DECLARE
  item RECORD;
  store_revenue NUMERIC(12, 2);
  test_order_id UUID := 'YOUR_ORDER_ID'; -- REPLACE THIS WITH YOUR ACTUAL ORDER ID
  test_order RECORD;
BEGIN
  -- Get the order details
  SELECT * INTO test_order FROM orders WHERE id = test_order_id;
  
  IF test_order.id IS NULL THEN
    RAISE NOTICE 'Order not found!';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Processing order: % with payment_status: % and total: %', 
    test_order.order_number, test_order.payment_status, test_order.total;
  
  -- Calculate total revenue
  store_revenue := test_order.total;
  
  -- Update store revenue
  UPDATE stores 
  SET total_revenue = COALESCE(total_revenue, 0) + store_revenue,
      updated_at = NOW()
  WHERE id = test_order.store_id;
  
  RAISE NOTICE 'Updated store % with revenue: %', test_order.store_id, store_revenue;
  
  -- Reduce inventory for each order item
  FOR item IN 
    SELECT inventory_id, qty 
    FROM order_items 
    WHERE order_id = test_order.id
  LOOP
    RAISE NOTICE 'Reducing inventory % by qty: %', item.inventory_id, item.qty;
    
    -- Reduce stock quantity
    UPDATE inventory 
    SET stock_qty = GREATEST(0, stock_qty - item.qty),
        updated_at = NOW()
    WHERE id = item.inventory_id;
  END LOOP;
  
  RAISE NOTICE 'Processing complete!';
END $$;
