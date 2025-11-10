-- Create wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own wishlist"
  ON public.wishlist
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own wishlist"
  ON public.wishlist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own wishlist"
  ON public.wishlist
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create saved payment methods table
CREATE TABLE IF NOT EXISTS public.saved_payment_methods (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('card', 'bank')),
  label TEXT NOT NULL,
  last_four TEXT NOT NULL,
  card_name TEXT,
  expiry_date TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own payment methods"
  ON public.saved_payment_methods
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add own payment methods"
  ON public.saved_payment_methods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods"
  ON public.saved_payment_methods
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods"
  ON public.saved_payment_methods
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_saved_payment_methods_updated_at
  BEFORE UPDATE ON public.saved_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();