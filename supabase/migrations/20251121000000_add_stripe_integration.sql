-- Add Stripe customer ID to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add payment_method_id to orders table for Stripe payment methods
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method_id TEXT;

-- Update saved_payment_methods table to support Stripe payment methods
ALTER TABLE public.saved_payment_methods
ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS card_brand TEXT,
ADD COLUMN IF NOT EXISTS card_exp_month INTEGER,
ADD COLUMN IF NOT EXISTS card_exp_year INTEGER;

-- Remove sensitive fields (these will be stored in Stripe, not in our DB)
-- We'll keep account_number and ifsc_code for COD validation purposes only
ALTER TABLE public.saved_payment_methods
DROP COLUMN IF EXISTS card_name CASCADE,
DROP COLUMN IF EXISTS expiry_date CASCADE;

-- Add check constraint to ensure either stripe_payment_method_id or account_number is present
ALTER TABLE public.saved_payment_methods
DROP CONSTRAINT IF EXISTS payment_method_data_check;

ALTER TABLE public.saved_payment_methods
ADD CONSTRAINT payment_method_data_check CHECK (
  (stripe_payment_method_id IS NOT NULL) OR 
  (account_number IS NOT NULL)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_stripe_id ON public.saved_payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method_id ON public.orders(payment_method_id);
