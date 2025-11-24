-- Track purchases when order is created (not just when delivered)
-- This allows proxy orders to find the correct wholesaler immediately

-- Update the tracking function to also track on order creation
CREATE OR REPLACE FUNCTION track_purchased_products()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  retailer_store RECORD;
BEGIN
  -- Track when status changes to 'delivered' OR when order is created with payment
  IF (NEW.status = 'delivered' AND (OLD IS NULL OR OLD.status != 'delivered'))
     OR (TG_OP = 'INSERT' AND NEW.payment_status IN ('paid', 'cod'))
     OR (TG_OP = 'UPDATE' AND NEW.status = 'pending' AND OLD.status IS DISTINCT FROM 'pending' AND NEW.payment_status IN ('paid', 'cod')) THEN
    
    -- Get the customer's retailer store (if they are a retailer)
    SELECT * INTO retailer_store 
    FROM stores 
    WHERE owner_id = NEW.customer_id AND type = 'retailer' 
    LIMIT 1;
    
    -- Only process if customer is a retailer AND order is from a wholesaler
    IF retailer_store.id IS NOT NULL THEN
      
      -- Verify the order is from a wholesaler store
      PERFORM 1 FROM stores 
      WHERE id = NEW.store_id AND type = 'wholesaler';
      
      IF FOUND THEN
        -- Track each order item
        FOR item IN 
          SELECT 
            oi.inventory_id,
            oi.qty,
            i.product_id
          FROM order_items oi
          JOIN inventory i ON oi.inventory_id = i.id
          WHERE oi.order_id = NEW.id
        LOOP
          -- Insert or update tracking record
          INSERT INTO purchased_product_tracking (
            retailer_store_id,
            product_id,
            source_order_id,
            purchased_qty,
            added_to_inventory_qty
          ) VALUES (
            retailer_store.id,
            item.product_id,
            NEW.id,
            item.qty,
            0
          )
          ON CONFLICT (retailer_store_id, product_id, source_order_id)
          DO UPDATE SET
            purchased_qty = purchased_product_tracking.purchased_qty + EXCLUDED.purchased_qty,
            updated_at = NOW();
        END LOOP;
      END IF;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to handle both INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_track_purchased_products ON orders;
CREATE TRIGGER trigger_track_purchased_products
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION track_purchased_products();

-- Backfill existing orders that are paid but not yet delivered
-- This ensures all existing retailer purchases are tracked
INSERT INTO purchased_product_tracking (
  retailer_store_id,
  product_id,
  source_order_id,
  purchased_qty,
  added_to_inventory_qty
)
SELECT 
  rs.id as retailer_store_id,
  i.product_id,
  o.id as source_order_id,
  oi.qty as purchased_qty,
  0 as added_to_inventory_qty
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN inventory i ON i.id = oi.inventory_id
JOIN stores ws ON ws.id = o.store_id AND ws.type = 'wholesaler'
JOIN stores rs ON rs.owner_id = o.customer_id AND rs.type = 'retailer'
WHERE o.payment_status IN ('paid', 'cod')
  AND NOT EXISTS (
    SELECT 1 FROM purchased_product_tracking ppt
    WHERE ppt.retailer_store_id = rs.id
      AND ppt.product_id = i.product_id
      AND ppt.source_order_id = o.id
  )
ON CONFLICT (retailer_store_id, product_id, source_order_id) 
DO NOTHING;
