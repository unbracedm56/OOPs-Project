import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { StripePaymentForm } from "./StripePaymentForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Shield, Loader2 } from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface StripePaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onFailure: () => void;
  amount: number;
  savePaymentMethod: boolean;
  metadata?: Record<string, string>;
}

const StripePaymentModal = ({ 
  open, 
  onClose, 
  onSuccess, 
  onFailure, 
  amount,
  savePaymentMethod,
  metadata = {}
}: StripePaymentModalProps) => {
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      initializePayment();
    }
  }, [open]);

  const initializePayment = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create or get Stripe customer if saving payment method
      let stripeCustomerId = null;
      if (savePaymentMethod) {
        const { data, error } = await supabase.functions.invoke('manage-stripe-customer', {
          body: { 
            action: 'create_customer',
            email: user.email,
            name: user.user_metadata?.full_name
          }
        });

        if (error) throw error;
        stripeCustomerId = data.customerId;
        setCustomerId(stripeCustomerId);
      }

      // Create payment intent
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { 
          amount,
          currency: 'inr',
          metadata,
          savePaymentMethod,
          customerId: stripeCustomerId
        }
      });

      if (error) throw error;
      
      setClientSecret(data.clientSecret);
    } catch (error: any) {
      console.error('Error initializing payment:', error);
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
      onFailure();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const appearance: any = {
    theme: 'stripe',
    variables: {
      colorPrimary: 'hsl(var(--primary))',
      colorBackground: 'hsl(var(--background))',
      colorText: 'hsl(var(--foreground))',
      colorDanger: 'hsl(var(--destructive))',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  const options: StripeElementsOptions = {
    clientSecret,
    appearance,
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            Secure Card Payment
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-primary" />
            Powered by Stripe - Your payment information is encrypted and secure
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Preparing secure payment...</p>
            </div>
          ) : clientSecret ? (
            <Elements options={options} stripe={stripePromise}>
              <StripePaymentForm
                amount={amount}
                onSuccess={onSuccess}
                onFailure={onFailure}
                savePaymentMethod={savePaymentMethod}
              />
            </Elements>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StripePaymentModal;
