-- Add warehouse_address_id to stores table
ALTER TABLE public.stores
ADD COLUMN warehouse_address_id uuid REFERENCES public.addresses(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN public.stores.warehouse_address_id IS 'Required warehouse/business location for retailers and wholesalers';

-- Create function to check if store has warehouse location
CREATE OR REPLACE FUNCTION public.store_has_warehouse_location(store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.stores
    WHERE id = store_id
      AND warehouse_address_id IS NOT NULL
  )
$$;

-- Create function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 numeric, 
  lon1 numeric, 
  lat2 numeric, 
  lon2 numeric
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  r numeric := 6371; -- Earth's radius in kilometers
  dlat numeric;
  dlon numeric;
  a numeric;
  c numeric;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN r * c;
END;
$$;