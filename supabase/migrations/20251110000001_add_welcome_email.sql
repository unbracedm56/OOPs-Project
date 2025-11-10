-- Create a function to send welcome email when user signs up
CREATE OR REPLACE FUNCTION public.send_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  user_name text;
  user_role text;
BEGIN
  -- Get user details
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Valued Customer');
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
  
  -- Send welcome email via Supabase Edge Function or external service
  -- Note: You'll need to set up an Edge Function or use a service like Resend/SendGrid
  -- For now, we'll log it and you can hook it up to your email service
  
  RAISE NOTICE 'Welcome email should be sent to: % (Name: %, Role: %)', user_email, user_name, user_role;
  
  -- Insert into a welcome_emails log table so you can process them
  INSERT INTO public.welcome_emails_queue (
    user_id,
    email,
    full_name,
    role,
    sent_at
  ) VALUES (
    NEW.id,
    user_email,
    user_name,
    user_role,
    NULL  -- Will be updated when actually sent
  );
  
  RETURN NEW;
END;
$$;

-- Create a table to queue welcome emails
CREATE TABLE IF NOT EXISTS public.welcome_emails_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error_message TEXT
);

-- Enable RLS on welcome_emails_queue
ALTER TABLE public.welcome_emails_queue ENABLE ROW LEVEL SECURITY;

-- Only admins can view the queue
CREATE POLICY "Admins can view welcome email queue"
ON public.welcome_emails_queue
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger to send welcome email on user creation
DROP TRIGGER IF EXISTS on_user_created_send_welcome_email ON auth.users;
CREATE TRIGGER on_user_created_send_welcome_email
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email();

-- Create an index for faster queries
CREATE INDEX idx_welcome_emails_queue_sent_at ON public.welcome_emails_queue(sent_at) WHERE sent_at IS NULL;
CREATE INDEX idx_welcome_emails_queue_user_id ON public.welcome_emails_queue(user_id);
