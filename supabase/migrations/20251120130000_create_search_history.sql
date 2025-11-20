-- Create search_history table to store user search queries
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  search_context TEXT, -- 'customer-dashboard', 'wholesaler-marketplace', etc.
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_user_context ON public.search_history(user_id, search_context);

-- Enable RLS
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own search history
CREATE POLICY "Users can view own search history"
ON public.search_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own search history
CREATE POLICY "Users can insert own search history"
ON public.search_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own search history
CREATE POLICY "Users can delete own search history"
ON public.search_history
FOR DELETE
USING (auth.uid() = user_id);
