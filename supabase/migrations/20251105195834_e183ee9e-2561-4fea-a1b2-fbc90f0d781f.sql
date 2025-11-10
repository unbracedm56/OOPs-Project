-- Add policy to allow users to insert their own role during initial signup
CREATE POLICY "Users can insert own role during first-time setup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()
  )
);