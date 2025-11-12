-- Test query to verify triggers work for BOTH retailers and wholesalers
-- Run this in Supabase SQL Editor to see the current state

-- Check revenue for both retailers and wholesalers
SELECT 
    s.id,
    s.name as store_name,
    s.type as store_type,
    s.total_revenue,
    COUNT(o.id) as total_orders,
    SUM(o.total) as total_order_value
FROM stores s
LEFT JOIN orders o ON s.id = o.store_id AND o.payment_status IN ('paid', 'cod')
WHERE s.type IN ('retailer', 'wholesaler')
GROUP BY s.id, s.name, s.type, s.total_revenue
ORDER BY s.type, s.name;

-- Check inventory for both retailers and wholesalers
SELECT 
    s.type as store_type,
    s.name as store_name,
    p.name as product_name,
    i.stock_qty,
    i.updated_at
FROM inventory i
JOIN stores s ON i.store_id = s.id
JOIN products p ON i.product_id = p.id
WHERE s.type IN ('retailer', 'wholesaler')
ORDER BY s.type, s.name, p.name;

-- Recent orders for both retailers and wholesalers
SELECT 
    o.order_number,
    o.payment_status,
    o.total,
    s.name as store_name,
    s.type as store_type,
    o.created_at
FROM orders o
JOIN stores s ON o.store_id = s.id
WHERE s.type IN ('retailer', 'wholesaler')
ORDER BY o.created_at DESC
LIMIT 20;
