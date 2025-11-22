-- Fix can_review_product function - use correct column name 'status' instead of 'order_status'

CREATE OR REPLACE FUNCTION can_review_product(
  _user_id UUID,
  _product_id UUID,
  _order_item_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  has_purchased BOOLEAN;
BEGIN
  -- Check if the user has a delivered order with this product
  -- order_items has inventory_id, orders has status (not order_status)
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
