-- Create email queue table for order-related emails
CREATE TABLE IF NOT EXISTS public.order_emails_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('order_confirmation', 'order_shipped', 'order_delivered')),
  recipient_email TEXT NOT NULL,
  order_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.order_emails_queue ENABLE ROW LEVEL SECURITY;

-- Admins can view all
CREATE POLICY "Admins can view order email queue"
ON public.order_emails_queue
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create indexes
CREATE INDEX idx_order_emails_queue_sent_at ON public.order_emails_queue(sent_at) WHERE sent_at IS NULL;
CREATE INDEX idx_order_emails_queue_order_id ON public.order_emails_queue(order_id);
CREATE INDEX idx_order_emails_queue_email_type ON public.order_emails_queue(email_type);

-- Function to queue order confirmation email
CREATE OR REPLACE FUNCTION public.queue_order_confirmation_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer_email text;
  customer_name text;
  order_data jsonb;
  store_info jsonb;
BEGIN
  -- Only trigger for new orders
  IF TG_OP = 'INSERT' THEN
    -- Get customer email and name
    SELECT 
      u.email,
      p.full_name
    INTO customer_email, customer_name
    FROM auth.users u
    JOIN profiles p ON p.id = u.id
    WHERE u.id = NEW.customer_id;
    
    -- Get store information
    SELECT jsonb_build_object(
      'store_name', s.name,
      'store_phone', s.phone
    )
    INTO store_info
    FROM stores s
    WHERE s.id = NEW.store_id;
    
    -- Build order data JSON
    order_data := jsonb_build_object(
      'order_number', NEW.order_number,
      'customer_name', customer_name,
      'total', NEW.total,
      'subtotal', NEW.subtotal,
      'tax', NEW.tax,
      'shipping_fee', NEW.shipping_fee,
      'status', NEW.status,
      'payment_status', NEW.payment_status,
      'delivery_mode', NEW.delivery_mode,
      'placed_at', NEW.placed_at,
      'store', store_info
    );
    
    -- Queue the email
    INSERT INTO public.order_emails_queue (
      order_id,
      user_id,
      email_type,
      recipient_email,
      order_data
    ) VALUES (
      NEW.id,
      NEW.customer_id,
      'order_confirmation',
      customer_email,
      order_data
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to queue delivery status emails
CREATE OR REPLACE FUNCTION public.queue_order_status_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer_email text;
  customer_name text;
  order_data jsonb;
  store_info jsonb;
  email_type text;
BEGIN
  -- Only trigger on status updates
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    
    -- Determine email type based on new status
    IF NEW.status = 'shipped' THEN
      email_type := 'order_shipped';
    ELSIF NEW.status = 'delivered' THEN
      email_type := 'order_delivered';
    ELSE
      -- Don't send email for other status changes
      RETURN NEW;
    END IF;
    
    -- Get customer email and name
    SELECT 
      u.email,
      p.full_name
    INTO customer_email, customer_name
    FROM auth.users u
    JOIN profiles p ON p.id = u.id
    WHERE u.id = NEW.customer_id;
    
    -- Get store information
    SELECT jsonb_build_object(
      'store_name', s.name,
      'store_phone', s.phone
    )
    INTO store_info
    FROM stores s
    WHERE s.id = NEW.store_id;
    
    -- Build order data JSON
    order_data := jsonb_build_object(
      'order_number', NEW.order_number,
      'customer_name', customer_name,
      'total', NEW.total,
      'status', NEW.status,
      'placed_at', NEW.placed_at,
      'store', store_info,
      'delivery_mode', NEW.delivery_mode
    );
    
    -- Queue the email
    INSERT INTO public.order_emails_queue (
      order_id,
      user_id,
      email_type,
      recipient_email,
      order_data
    ) VALUES (
      NEW.id,
      NEW.customer_id,
      email_type,
      customer_email,
      order_data
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for order confirmation (on INSERT)
DROP TRIGGER IF EXISTS on_order_created_send_confirmation ON orders;
CREATE TRIGGER on_order_created_send_confirmation
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_order_confirmation_email();

-- Create trigger for delivery status updates (on UPDATE)
DROP TRIGGER IF EXISTS on_order_status_changed_send_notification ON orders;
CREATE TRIGGER on_order_status_changed_send_notification
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_order_status_email();
