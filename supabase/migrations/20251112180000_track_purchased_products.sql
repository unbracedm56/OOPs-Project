-- Create table to track purchased products and their usage
CREATE TABLE IF NOT EXISTS purchased_product_tracking (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  retailer_store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  source_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  purchased_qty INTEGER NOT NULL,
  added_to_inventory_qty INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(retailer_store_id, product_id, source_order_id)
);

-- Enable RLS
ALTER TABLE purchased_product_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Retailers can view own purchased products"
  ON purchased_product_tracking FOR SELECT
  USING (
    retailer_store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "Retailers can manage own purchased products"
  ON purchased_product_tracking FOR ALL
  USING (
    retailer_store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- Function to track purchased products when order is delivered
CREATE OR REPLACE FUNCTION track_purchased_products()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  retailer_store RECORD;
BEGIN
  -- Only track when status changes to 'delivered'
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    
    -- Get the customer's retailer store (if they are a retailer)
    SELECT * INTO retailer_store 
    FROM stores 
    WHERE owner_id = NEW.customer_id AND type = 'retailer' 
    LIMIT 1;
    
    -- Only process if customer is a retailer
    IF retailer_store.id IS NOT NULL THEN
      
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_track_purchased_products ON orders;
CREATE TRIGGER trigger_track_purchased_products
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION track_purchased_products();

-- Function to update tracking when adding to inventory
CREATE OR REPLACE FUNCTION update_purchased_tracking_on_inventory_add()
RETURNS TRIGGER AS $$
DECLARE
  tracking_record RECORD;
BEGIN
  -- Only process for purchased products
  IF NEW.source_type = 'purchased' AND NEW.source_order_id IS NOT NULL THEN
    
    -- Get tracking record
    SELECT * INTO tracking_record
    FROM purchased_product_tracking
    WHERE retailer_store_id = NEW.store_id
      AND product_id = NEW.product_id
      AND source_order_id = NEW.source_order_id;
    
    -- Check if enough quantity is available
    IF tracking_record.id IS NULL THEN
      RAISE EXCEPTION 'No purchased product tracking found for this item';
    END IF;
    
    IF (tracking_record.added_to_inventory_qty + NEW.stock_qty) > tracking_record.purchased_qty THEN
      RAISE EXCEPTION 'Cannot add % units. Only % units available (purchased: %, already added: %)',
        NEW.stock_qty,
        tracking_record.purchased_qty - tracking_record.added_to_inventory_qty,
        tracking_record.purchased_qty,
        tracking_record.added_to_inventory_qty;
    END IF;
    
    -- Update tracking record
    UPDATE purchased_product_tracking
    SET added_to_inventory_qty = added_to_inventory_qty + NEW.stock_qty,
        updated_at = NOW()
    WHERE id = tracking_record.id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate updates to inventory
CREATE OR REPLACE FUNCTION validate_purchased_inventory_update()
RETURNS TRIGGER AS $$
DECLARE
  tracking_record RECORD;
  qty_increase INTEGER;
BEGIN
  -- Only process for purchased products when quantity increases
  IF NEW.source_type = 'purchased' AND NEW.source_order_id IS NOT NULL THEN
    
    -- Calculate quantity increase
    qty_increase := NEW.stock_qty - OLD.stock_qty;
    
    -- If quantity increased, validate against purchased amount
    IF qty_increase > 0 THEN
      
      -- Get tracking record
      SELECT * INTO tracking_record
      FROM purchased_product_tracking
      WHERE retailer_store_id = NEW.store_id
        AND product_id = NEW.product_id
        AND source_order_id = NEW.source_order_id;
      
      IF tracking_record.id IS NULL THEN
        RAISE EXCEPTION 'No purchased product tracking found for this item';
      END IF;
      
      -- Calculate total that would be added including this increase
      IF (tracking_record.added_to_inventory_qty + qty_increase) > tracking_record.purchased_qty THEN
        RAISE EXCEPTION 'Cannot increase quantity by %. Only % units available (purchased: %, already in inventory: %)',
          qty_increase,
          tracking_record.purchased_qty - tracking_record.added_to_inventory_qty,
          tracking_record.purchased_qty,
          tracking_record.added_to_inventory_qty;
      END IF;
      
      -- Update tracking record
      UPDATE purchased_product_tracking
      SET added_to_inventory_qty = added_to_inventory_qty + qty_increase,
          updated_at = NOW()
      WHERE id = tracking_record.id;
      
    -- If quantity decreased, update tracking
    ELSIF qty_increase < 0 THEN
      UPDATE purchased_product_tracking
      SET added_to_inventory_qty = GREATEST(0, added_to_inventory_qty + qty_increase),
          updated_at = NOW()
      WHERE retailer_store_id = NEW.store_id
        AND product_id = NEW.product_id
        AND source_order_id = NEW.source_order_id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on inventory for INSERT
DROP TRIGGER IF EXISTS trigger_update_purchased_tracking ON inventory;
CREATE TRIGGER trigger_update_purchased_tracking
  BEFORE INSERT ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_purchased_tracking_on_inventory_add();

-- Create trigger on inventory for UPDATE
DROP TRIGGER IF EXISTS trigger_validate_purchased_update ON inventory;
CREATE TRIGGER trigger_validate_purchased_update
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION validate_purchased_inventory_update();

-- Backfill existing delivered orders
DO $$
DECLARE
  order_record RECORD;
  item RECORD;
  retailer_store RECORD;
BEGIN
  FOR order_record IN 
    SELECT * FROM orders WHERE status = 'delivered'
  LOOP
    -- Get the customer's retailer store
    SELECT * INTO retailer_store 
    FROM stores 
    WHERE owner_id = order_record.customer_id AND type = 'retailer' 
    LIMIT 1;
    
    IF retailer_store.id IS NOT NULL THEN
      FOR item IN 
        SELECT 
          oi.inventory_id,
          oi.qty,
          i.product_id
        FROM order_items oi
        JOIN inventory i ON oi.inventory_id = i.id
        WHERE oi.order_id = order_record.id
      LOOP
        INSERT INTO purchased_product_tracking (
          retailer_store_id,
          product_id,
          source_order_id,
          purchased_qty,
          added_to_inventory_qty
        ) VALUES (
          retailer_store.id,
          item.product_id,
          order_record.id,
          item.qty,
          0
        )
        ON CONFLICT (retailer_store_id, product_id, source_order_id)
        DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
  
  -- Update added_to_inventory_qty for existing inventory items
  UPDATE purchased_product_tracking ppt
  SET added_to_inventory_qty = (
    SELECT COALESCE(SUM(i.stock_qty), 0)
    FROM inventory i
    WHERE i.store_id = ppt.retailer_store_id
      AND i.product_id = ppt.product_id
      AND i.source_order_id = ppt.source_order_id
      AND i.source_type = 'purchased'
  ),
  updated_at = NOW();
END $$;

-- Helper function to get available quantity for a product
CREATE OR REPLACE FUNCTION get_available_purchased_qty(
  p_retailer_store_id UUID,
  p_product_id UUID,
  p_source_order_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_purchased INTEGER;
  v_added INTEGER;
BEGIN
  SELECT 
    COALESCE(purchased_qty, 0),
    COALESCE(added_to_inventory_qty, 0)
  INTO v_purchased, v_added
  FROM purchased_product_tracking
  WHERE retailer_store_id = p_retailer_store_id
    AND product_id = p_product_id
    AND source_order_id = p_source_order_id;
  
  RETURN COALESCE(v_purchased - v_added, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
