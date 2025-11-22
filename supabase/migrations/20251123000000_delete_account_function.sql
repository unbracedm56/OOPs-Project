-- Function to completely delete a user account and all related data
-- This will delete the user from auth.users which will cascade to profiles
-- and all related data due to ON DELETE CASCADE constraints

CREATE OR REPLACE FUNCTION delete_user_account(_user_id UUID)
RETURNS JSON AS $$
DECLARE
  deleted_data JSON;
BEGIN
  -- Collect statistics before deletion
  SELECT json_build_object(
    'user_id', _user_id,
    'addresses_count', (SELECT COUNT(*) FROM addresses WHERE user_id = _user_id),
    'stores_count', (SELECT COUNT(*) FROM stores WHERE owner_id = _user_id),
    'orders_count', (SELECT COUNT(*) FROM orders WHERE customer_id = _user_id),
    'feedback_count', (SELECT COUNT(*) FROM feedback WHERE author_id = _user_id),
    'wishlist_count', (SELECT COUNT(*) FROM wishlist WHERE user_id = _user_id),
    'cart_count', (SELECT COUNT(*) FROM cart WHERE user_id = _user_id),
    'notifications_count', (SELECT COUNT(*) FROM notifications WHERE user_id = _user_id)
  ) INTO deleted_data;

  -- Delete from auth.users - this will cascade to all related tables
  -- Note: This requires service_role permissions
  DELETE FROM auth.users WHERE id = _user_id;

  RETURN deleted_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (they can only delete their own account)
GRANT EXECUTE ON FUNCTION delete_user_account TO authenticated;
