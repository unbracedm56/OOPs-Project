import { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Shield } from "lucide-react";

interface StripePaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onFailure: () => void;
  savePaymentMethod: boolean;
}

export const StripePaymentForm = ({
  amount,
  onSuccess,
  onFailure,
  savePaymentMethod
}: StripePaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Your payment was not successful, please try again.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-success`,
      },
      redirect: "if_required",
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "Payment failed");
      } else {
        setMessage("An unexpected error occurred.");
      }
      setProcessing(false);
      onFailure();
    } else {
      setProcessing(false);
      onSuccess();
    }
  };

  const paymentElementOptions: any = {
    layout: "tabs",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-6 border border-primary/20">
        <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Amount to Pay
        </p>
        <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          ₹{amount.toFixed(2)}
        </p>
      </div>

      <div className="space-y-4">
        <PaymentElement options={paymentElementOptions} />
      </div>

      {message && (
        <div className={`text-sm p-3 rounded-lg ${
          message.includes("succeeded") 
            ? "bg-green-50 text-green-800 border border-green-200" 
            : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {message}
        </div>
      )}

      {savePaymentMethod && (
        <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
          <CreditCard className="h-4 w-4 inline mr-2" />
          Your payment method will be securely saved for future purchases
        </div>
      )}

      <Button
        type="submit"
        disabled={processing || !stripe || !elements}
        className="w-full h-12 text-base font-semibold"
        size="lg"
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Pay ₹{amount.toFixed(2)}
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Secured by Stripe • Your payment information is encrypted
      </p>
    </form>
  );
};
