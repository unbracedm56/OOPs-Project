-- Check inventory before and after order
-- Run this to see current inventory state

SELECT 
    i.id,
    i.product_id,
    p.name as product_name,
    i.stock_qty,
    i.updated_at,
    s.store_name,
    s.user_role
FROM inventory i
JOIN products p ON i.product_id = p.id
JOIN stores s ON i.store_id = s.id
ORDER BY i.updated_at DESC
LIMIT 10;

-- Check order items to see what inventory should be reduced
SELECT 
    oi.order_id,
    oi.inventory_id,
    oi.qty,
    o.order_number,
    o.payment_status,
    o.created_at,
    i.stock_qty as current_stock
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN inventory i ON oi.inventory_id = i.id
WHERE o.payment_status = 'cod'
ORDER BY o.created_at DESC
LIMIT 10;
