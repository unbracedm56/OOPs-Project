-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order', 'payment', 'delivery', 'wishlist', 'cart', 'product', 'account', 'general')),
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: System can insert notifications for any user
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_action_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, action_url)
  VALUES (p_user_id, p_title, p_message, p_type, p_action_url)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to send notification on order creation
CREATE OR REPLACE FUNCTION notify_order_created() RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification(
    NEW.customer_id,
    'Order Placed Successfully',
    'Your order #' || NEW.order_number || ' has been placed successfully. Total: ₹' || NEW.total,
    'order',
    '/orders'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to send notification on order status update
CREATE OR REPLACE FUNCTION notify_order_status_changed() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    PERFORM create_notification(
      NEW.customer_id,
      'Order Status Updated',
      'Your order #' || NEW.order_number || ' status changed to: ' || NEW.status,
      'order',
      '/orders'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to send notification on payment status update
CREATE OR REPLACE FUNCTION notify_payment_status_changed() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status != OLD.payment_status THEN
    PERFORM create_notification(
      NEW.customer_id,
      'Payment Status Updated',
      'Your payment for order #' || NEW.order_number || ' is now: ' || NEW.payment_status,
      'payment',
      '/orders'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to send notification when product is back in stock
CREATE OR REPLACE FUNCTION notify_product_back_in_stock() RETURNS TRIGGER AS $$
DECLARE
  v_product_name TEXT;
  v_user_id UUID;
BEGIN
  -- Only notify if stock goes from 0 to > 0
  IF OLD.stock_qty = 0 AND NEW.stock_qty > 0 THEN
    -- Get product name
    SELECT name INTO v_product_name FROM products WHERE id = NEW.product_id;
    
    -- Notify all users who have this product in their wishlist
    FOR v_user_id IN 
      SELECT DISTINCT user_id FROM wishlist WHERE product_id = NEW.product_id
    LOOP
      PERFORM create_notification(
        v_user_id,
        'Product Back in Stock',
        v_product_name || ' is now available!',
        'product',
        '/product/' || NEW.product_id
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to send notification on price drop
CREATE OR REPLACE FUNCTION notify_price_drop() RETURNS TRIGGER AS $$
DECLARE
  v_product_name TEXT;
  v_user_id UUID;
  v_discount_percent NUMERIC;
BEGIN
  -- Only notify if price decreased by more than 10%
  IF NEW.price < OLD.price THEN
    v_discount_percent := ((OLD.price - NEW.price) / OLD.price) * 100;
    
    IF v_discount_percent > 10 THEN
      -- Get product name
      SELECT name INTO v_product_name FROM products WHERE id = NEW.product_id;
      
      -- Notify all users who have this product in their wishlist
      FOR v_user_id IN 
        SELECT DISTINCT user_id FROM wishlist WHERE product_id = NEW.product_id
      LOOP
        PERFORM create_notification(
          v_user_id,
          'Price Drop Alert',
          v_product_name || ' is now ' || ROUND(v_discount_percent) || '% off!',
          'product',
          '/product/' || NEW.product_id
        );
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_notify_order_created
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_created();

CREATE TRIGGER trigger_notify_order_status_changed
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_order_status_changed();

CREATE TRIGGER trigger_notify_payment_status_changed
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status)
  EXECUTE FUNCTION notify_payment_status_changed();

CREATE TRIGGER trigger_notify_product_back_in_stock
  AFTER UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION notify_product_back_in_stock();

CREATE TRIGGER trigger_notify_price_drop
  AFTER UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION notify_price_drop();
