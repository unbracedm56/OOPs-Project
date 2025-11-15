-- Create proxy orders system for automatic retailer->wholesaler ordering
-- When customer orders more than retailer has, system auto-creates order from retailer to wholesaler

-- Create proxy order status enum
CREATE TYPE proxy_order_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled', 'completed');

-- Create proxy_orders table (tracks retailer->wholesaler orders)
CREATE TABLE proxy_orders (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  proxy_order_number TEXT NOT NULL UNIQUE,
  
  -- Retailer who needs the stock
  retailer_store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Wholesaler providing the stock
  wholesaler_store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Product and quantity details
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES inventory(id), -- wholesaler's inventory
  qty INTEGER NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  total NUMERIC(12, 2) NOT NULL,
  
  -- Linked customer order (the original order that triggered this proxy order)
  customer_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Status tracking
  status proxy_order_status NOT NULL DEFAULT 'pending',
  
  -- Payment tracking
  payment_status payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  
  -- Stock transfer tracking
  stock_transferred BOOLEAN DEFAULT false,
  transferred_at TIMESTAMPTZ,
  
  -- Notes
  retailer_notes TEXT,
  wholesaler_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ
);

-- Create index for faster queries
CREATE INDEX idx_proxy_orders_retailer ON proxy_orders(retailer_store_id);
CREATE INDEX idx_proxy_orders_wholesaler ON proxy_orders(wholesaler_store_id);
CREATE INDEX idx_proxy_orders_customer_order ON proxy_orders(customer_order_id);
CREATE INDEX idx_proxy_orders_status ON proxy_orders(status);

-- Function to generate proxy order number
CREATE OR REPLACE FUNCTION generate_proxy_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Get count of proxy orders today
  SELECT COUNT(*) INTO counter
  FROM proxy_orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Format: PXY-YYYYMMDD-NNNN
  new_number := 'PXY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((counter + 1)::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate proxy order number
CREATE OR REPLACE FUNCTION set_proxy_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.proxy_order_number IS NULL OR NEW.proxy_order_number = '' THEN
    NEW.proxy_order_number := generate_proxy_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_proxy_order_number
  BEFORE INSERT ON proxy_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_proxy_order_number();

-- Function to transfer stock when proxy order is approved and paid
CREATE OR REPLACE FUNCTION transfer_proxy_order_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Only transfer stock when order is approved AND paid
  IF NEW.status = 'approved' AND NEW.payment_status = 'paid' AND NEW.stock_transferred = false THEN
    
    -- Reduce wholesaler's inventory
    UPDATE inventory
    SET stock_qty = stock_qty - NEW.qty,
        updated_at = NOW()
    WHERE id = NEW.inventory_id
    AND stock_qty >= NEW.qty; -- Safety check
    
    -- Check if update was successful
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock in wholesaler inventory';
    END IF;
    
    -- Add to retailer's inventory (find or create)
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
      wi.price, -- Use wholesaler's price as base
      wi.mrp,
      true,
      COALESCE(wi.delivery_days, 3),
      'purchased',
      NEW.customer_order_id
    FROM inventory wi
    WHERE wi.id = NEW.inventory_id
    ON CONFLICT (store_id, product_id)
    DO UPDATE SET
      stock_qty = inventory.stock_qty + NEW.qty,
      updated_at = NOW();
    
    -- Mark stock as transferred
    NEW.stock_transferred := true;
    NEW.transferred_at := NOW();
    
    -- Mark proxy order as completed
    NEW.status := 'completed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_transfer_proxy_stock
  BEFORE UPDATE ON proxy_orders
  FOR EACH ROW
  EXECUTE FUNCTION transfer_proxy_order_stock();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_proxy_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_proxy_order_timestamp
  BEFORE UPDATE ON proxy_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_proxy_order_timestamp();

-- RLS Policies
ALTER TABLE proxy_orders ENABLE ROW LEVEL SECURITY;

-- Retailers can see their own proxy orders
CREATE POLICY "Retailers can view their proxy orders"
  ON proxy_orders FOR SELECT
  USING (
    retailer_store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- Wholesalers can see proxy orders for their store
CREATE POLICY "Wholesalers can view proxy orders for their store"
  ON proxy_orders FOR SELECT
  USING (
    wholesaler_store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- Retailers can update payment status of their proxy orders
CREATE POLICY "Retailers can update their proxy orders"
  ON proxy_orders FOR UPDATE
  USING (
    retailer_store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- Wholesalers can update status of proxy orders for their store
CREATE POLICY "Wholesalers can update proxy orders for their store"
  ON proxy_orders FOR UPDATE
  USING (
    wholesaler_store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- System can insert proxy orders (no user restriction)
CREATE POLICY "Allow proxy order creation"
  ON proxy_orders FOR INSERT
  WITH CHECK (true);
