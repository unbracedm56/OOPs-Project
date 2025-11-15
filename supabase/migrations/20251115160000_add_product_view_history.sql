-- Create product_view_history table to track customer product views
CREATE TABLE IF NOT EXISTS product_view_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_product_view_history_user_id ON product_view_history(user_id);
CREATE INDEX IF NOT EXISTS idx_product_view_history_viewed_at ON product_view_history(viewed_at DESC);

-- Enable RLS
ALTER TABLE product_view_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own history
CREATE POLICY "Users can view own product history"
  ON product_view_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own history
CREATE POLICY "Users can insert own product history"
  ON product_view_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own history (for updating viewed_at timestamp)
CREATE POLICY "Users can update own product history"
  ON product_view_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own history
CREATE POLICY "Users can delete own product history"
  ON product_view_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
