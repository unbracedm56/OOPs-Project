-- Fix the proxy order trigger to properly add stock to retailer inventory
-- The issue was with the INSERT...ON CONFLICT clause and source_order_id

DROP TRIGGER IF EXISTS trigger_add_stock_to_retailer_on_proxy_delivery ON proxy_orders;
DROP FUNCTION IF EXISTS add_stock_to_retailer_on_proxy_delivery();

-- Recreate the function with a simpler approach
CREATE OR REPLACE FUNCTION add_stock_to_retailer_on_proxy_delivery()
RETURNS TRIGGER AS $$
DECLARE
  v_wholesaler_inv RECORD;
BEGIN
  -- When proxy order status changes to delivered_to_retailer, add stock to retailer
  IF NEW.status = 'delivered_to_retailer' AND OLD.status != 'delivered_to_retailer' THEN
    
    -- Get wholesaler inventory details
    SELECT * INTO v_wholesaler_inv
    FROM inventory
    WHERE id = NEW.inventory_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Wholesaler inventory not found';
    END IF;
    
    -- Check if retailer already has this product in inventory
    IF EXISTS (
      SELECT 1 FROM inventory 
      WHERE store_id = NEW.retailer_store_id 
      AND product_id = NEW.product_id
    ) THEN
      -- Update existing inventory
      UPDATE inventory
      SET 
        stock_qty = stock_qty + NEW.qty,
        updated_at = NOW()
      WHERE store_id = NEW.retailer_store_id 
      AND product_id = NEW.product_id;
    ELSE
      -- Create new inventory entry
      INSERT INTO inventory (
        store_id,
        product_id,
        stock_qty,
        price,
        mrp,
        is_active,
        delivery_days,
        source_type
      ) VALUES (
        NEW.retailer_store_id,
        NEW.product_id,
        NEW.qty,
        v_wholesaler_inv.price * 1.1, -- Retailer markup
        v_wholesaler_inv.mrp,
        true,
        COALESCE(v_wholesaler_inv.delivery_days, 3),
        'purchased'
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_add_stock_to_retailer_on_proxy_delivery
  AFTER UPDATE ON proxy_orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered_to_retailer' AND OLD.status != 'delivered_to_retailer')
  EXECUTE FUNCTION add_stock_to_retailer_on_proxy_delivery();
