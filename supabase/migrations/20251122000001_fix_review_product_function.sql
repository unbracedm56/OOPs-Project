-- Fix can_review_product function to use inventory table properly
-- order_items table has inventory_id, not product_id
-- orders table has status, not order_status

CREATE OR REPLACE FUNCTION can_review_product(
  _user_id UUID,
  _product_id UUID,
  _order_item_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  has_purchased BOOLEAN;
BEGIN
  -- Check if the user has a delivered order with this product
  -- Need to join through inventory table since order_items has inventory_id
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
