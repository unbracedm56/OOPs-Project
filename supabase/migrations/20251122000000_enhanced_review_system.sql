-- Enhanced Review System for Customer-to-Retailer and Retailer-to-Wholesaler reviews

-- Add constraint to ensure feedback is only given after purchase
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_product_published ON feedback(product_id, is_published);
CREATE INDEX IF NOT EXISTS idx_feedback_author ON feedback(author_id);
CREATE INDEX IF NOT EXISTS idx_feedback_order_item ON feedback(order_item_id);

-- Function to check if user has purchased the product
CREATE OR REPLACE FUNCTION can_review_product(
  _user_id UUID,
  _product_id UUID,
  _order_item_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  has_purchased BOOLEAN;
BEGIN
  -- Check if the user has a delivered order with this product
  SELECT EXISTS(
    SELECT 1
    FROM order_items oi
    JOIN inventory inv ON oi.inventory_id = inv.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.customer_id = _user_id
      AND inv.product_id = _product_id
      AND o.status = 'delivered'
      AND (_order_item_id IS NULL OR oi.id = _order_item_id)
  ) INTO has_purchased;
  
  RETURN has_purchased;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get reviews for a product (visible to appropriate users)
CREATE OR REPLACE FUNCTION get_product_reviews(_product_id UUID)
RETURNS TABLE (
  id UUID,
  rating INTEGER,
  title TEXT,
  body TEXT,
  created_at TIMESTAMPTZ,
  author_name TEXT,
  verified_purchase BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.rating,
    f.title,
    f.body,
    f.created_at,
    p.full_name as author_name,
    f.verified_purchase
  FROM feedback f
  JOIN profiles p ON f.author_id = p.id
  WHERE f.product_id = _product_id
    AND f.is_published = true
  ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get reviews for products sold by a store (for retailers/wholesalers)
CREATE OR REPLACE FUNCTION get_store_product_reviews(_store_id UUID)
RETURNS TABLE (
  review_id UUID,
  product_id UUID,
  product_name TEXT,
  rating INTEGER,
  title TEXT,
  body TEXT,
  created_at TIMESTAMPTZ,
  author_name TEXT,
  verified_purchase BOOLEAN,
  is_published BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as review_id,
    pr.id as product_id,
    pr.name as product_name,
    f.rating,
    f.title,
    f.body,
    f.created_at,
    p.full_name as author_name,
    f.verified_purchase,
    f.is_published
  FROM feedback f
  JOIN products pr ON f.product_id = pr.id
  JOIN inventory inv ON pr.id = inv.product_id
  JOIN profiles p ON f.author_id = p.id
  WHERE inv.store_id = _store_id
  ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to mark verified purchases
CREATE OR REPLACE FUNCTION mark_verified_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is a verified purchase
  NEW.verified_purchase := can_review_product(
    NEW.author_id,
    NEW.product_id,
    NEW.order_item_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mark_verified_purchase ON feedback;
CREATE TRIGGER trigger_mark_verified_purchase
  BEFORE INSERT ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION mark_verified_purchase();

-- Grant permissions
GRANT EXECUTE ON FUNCTION can_review_product TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_reviews TO authenticated;
GRANT EXECUTE ON FUNCTION get_store_product_reviews TO authenticated;
