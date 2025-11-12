-- Drop the unique constraint on inventory to allow multiple entries for same product
-- This allows retailers to have separate inventory batches from different purchases

ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_store_id_product_id_key;

-- Note: This allows retailers to:
-- 1. Purchase same product from different wholesalers
-- 2. Purchase same product multiple times and track separate batches
-- 3. Have different pricing for different batches of same product
-- 
-- The source_order_id and source_type columns help track where each batch came from
