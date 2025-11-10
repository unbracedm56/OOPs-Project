-- Add rating columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS product_rating numeric CHECK (product_rating >= 0 AND product_rating <= 5),
ADD COLUMN IF NOT EXISTS overall_rating numeric CHECK (overall_rating >= 0 AND overall_rating <= 5),
ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0;

-- Add retail_price column to track original MRP if needed
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS retail_price numeric;

-- Create a function to import products from CSV data
CREATE OR REPLACE FUNCTION public.import_product_data(
  p_name text,
  p_brand text,
  p_description text,
  p_category_name text,
  p_image_url text,
  p_retail_price numeric,
  p_discounted_price numeric,
  p_product_rating numeric DEFAULT NULL,
  p_overall_rating numeric DEFAULT NULL,
  p_store_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id uuid;
  v_category_id uuid;
  v_slug text;
BEGIN
  -- Generate slug from product name
  v_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g');
  
  -- Find or create category
  SELECT id INTO v_category_id
  FROM public.categories
  WHERE name = p_category_name
  LIMIT 1;
  
  IF v_category_id IS NULL THEN
    INSERT INTO public.categories (name, slug)
    VALUES (p_category_name, lower(regexp_replace(p_category_name, '[^a-zA-Z0-9]+', '-', 'g')))
    RETURNING id INTO v_category_id;
  END IF;
  
  -- Insert product
  INSERT INTO public.products (
    name,
    slug,
    description,
    brand,
    category_id,
    images,
    product_rating,
    overall_rating,
    created_by_store_id
  ) VALUES (
    p_name,
    v_slug || '-' || substr(md5(random()::text), 1, 6),
    p_description,
    p_brand,
    v_category_id,
    jsonb_build_array(p_image_url),
    p_product_rating,
    p_overall_rating,
    p_store_id
  )
  RETURNING id INTO v_product_id;
  
  -- Insert inventory if store_id provided
  IF p_store_id IS NOT NULL THEN
    INSERT INTO public.inventory (
      product_id,
      store_id,
      price,
      mrp,
      retail_price,
      stock_qty,
      is_active
    ) VALUES (
      v_product_id,
      p_store_id,
      COALESCE(p_discounted_price, p_retail_price),
      p_retail_price,
      p_retail_price,
      FLOOR(RANDOM() * 50 + 10)::integer,
      true
    );
  END IF;
  
  RETURN v_product_id;
END;
$$;