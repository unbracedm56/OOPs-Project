-- Test if trigger is working for inventory reduction
-- This will show you what's happening step by step

DO $$
DECLARE
  latest_order RECORD;
  item RECORD;
  inventory_before INTEGER;
  inventory_after INTEGER;
BEGIN
  -- Get the most recent COD order
  SELECT * INTO latest_order 
  FROM orders 
  WHERE payment_status = 'cod' 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF latest_order.id IS NULL THEN
    RAISE NOTICE 'No COD orders found';
    RETURN;
  END IF;
  
  RAISE NOTICE '=== Testing Order: % ===', latest_order.order_number;
  RAISE NOTICE 'Order ID: %', latest_order.id;
  RAISE NOTICE 'Payment Status: %', latest_order.payment_status;
  RAISE NOTICE 'Total: %', latest_order.total;
  
  -- Check each order item and its inventory
  FOR item IN 
    SELECT 
      oi.inventory_id,
      oi.qty as ordered_qty,
      i.stock_qty as current_stock,
      p.name as product_name
    FROM order_items oi
    JOIN inventory i ON oi.inventory_id = i.id
    JOIN products p ON i.product_id = p.id
    WHERE oi.order_id = latest_order.id
  LOOP
    RAISE NOTICE '';
    RAISE NOTICE 'Product: %', item.product_name;
    RAISE NOTICE 'Inventory ID: %', item.inventory_id;
    RAISE NOTICE 'Ordered Quantity: %', item.ordered_qty;
    RAISE NOTICE 'Current Stock: %', item.current_stock;
    RAISE NOTICE 'Expected Stock: %', item.current_stock - item.ordered_qty;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== End Test ===';
END $$;
