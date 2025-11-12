-- Debug: Check if trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_order_confirmation';

-- Debug: Check if function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_order_confirmation';

-- Debug: Check recent orders
SELECT 
    id,
    order_number,
    store_id,
    total,
    payment_status,
    status,
    created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- Debug: Check store revenue
SELECT 
    id,
    store_name,
    total_revenue,
    updated_at
FROM stores
WHERE user_role IN ('retailer', 'wholesaler')
ORDER BY updated_at DESC
LIMIT 5;
