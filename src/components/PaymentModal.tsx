import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Building2, Shield, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onFailure: () => void;
  paymentMethod: string;
  amount: number;
  savedPaymentId?: string;
}

const PaymentModal = ({ 
  open, 
  onClose, 
  onSuccess, 
  onFailure, 
  paymentMethod, 
  amount,
  savedPaymentId 
}: PaymentModalProps) => {
  const { toast } = useToast();
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [savePayment, setSavePayment] = useState(false);
  const [paymentLabel, setPaymentLabel] = useState("");
  const [usingSavedPayment, setUsingSavedPayment] = useState(false);

  useEffect(() => {
    if (savedPaymentId) {
      loadSavedPayment();
    }
  }, [savedPaymentId]);

  const loadSavedPayment = async () => {
    if (!savedPaymentId) return;

    const { data } = await supabase
      .from("saved_payment_methods")
      .select("*")
      .eq("id", savedPaymentId)
      .single();

    if (data) {
      setUsingSavedPayment(true);
      setPaymentLabel(data.label);
      if (data.payment_type === "card") {
        setCardName(data.card_name || "");
        setExpiryDate(data.expiry_date || "");
      } else {
        setIfscCode(data.ifsc_code || "");
      }
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simple validation simulation
    let isValid = false;
    if (usingSavedPayment) {
      isValid = true; // Saved payments are pre-validated
    } else if (paymentMethod === "card") {
      isValid = cardNumber.length === 16 && cvv.length === 3 && cardName.trim() !== "";
    } else if (paymentMethod === "bank") {
      isValid = accountNumber.length >= 10 && ifscCode.length === 11;
    }

    if (isValid) {
      // SECURITY WARNING: This stores payment data in plain text
      // For production, implement proper tokenization via payment providers (Stripe/Razorpay)
      // or use field-level encryption with pgcrypto extension
      // Save payment method if requested and not using saved payment
      if (savePayment && !usingSavedPayment && paymentLabel.trim() !== "") {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const lastFour = paymentMethod === "card" 
              ? cardNumber.slice(-4) 
              : accountNumber.slice(-4);

            await supabase
              .from("saved_payment_methods")
              .insert({
                user_id: user.id,
                payment_type: paymentMethod,
                label: paymentLabel,
                last_four: lastFour,
                card_name: paymentMethod === "card" ? cardName : null,
                expiry_date: paymentMethod === "card" ? expiryDate : null,
                account_number: paymentMethod === "bank" ? accountNumber : null,
                ifsc_code: paymentMethod === "bank" ? ifscCode : null,
              });

            toast({
              title: "Payment method saved",
              description: "You can use this payment method for future purchases.",
            });
          }
        } catch (error) {
          console.error("Error saving payment method:", error);
        }
      }

      setProcessing(false);
      onSuccess();
    } else {
      setProcessing(false);
      onFailure();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {paymentMethod === "card" ? (
              <>
                <div className="p-2 rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                Secure Card Payment
              </>
            ) : (
              <>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                Bank Transfer
              </>
            )}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-primary" />
            Your payment information is encrypted and secure
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-6 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Lock className="h-3 w-3" />
              Amount to Pay
            </p>
            <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              ₹{amount.toFixed(2)}
            </p>
          </div>

          {usingSavedPayment ? (
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm font-medium mb-1">Using saved payment method</p>
              <p className="text-sm text-muted-foreground">{paymentLabel}</p>
              <p className="text-xs text-muted-foreground mt-2">
                You'll only need to enter your CVV to complete this payment
              </p>
            </div>
          ) : null}

          {paymentMethod === "card" ? (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardName" className="text-sm font-medium">
                    Cardholder Name
                  </Label>
                  <Input
                    id="cardName"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    disabled={usingSavedPayment}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardNumber" className="text-sm font-medium">
                    Card Number
                  </Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    maxLength={16}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ""))}
                    disabled={usingSavedPayment}
                    className="h-11 tracking-wider"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry" className="text-sm font-medium">
                      Expiry Date
                    </Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      disabled={usingSavedPayment}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv" className="text-sm font-medium">
                      CVV
                    </Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      maxLength={3}
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber" className="text-sm font-medium">
                    Account Number
                  </Label>
                  <Input
                    id="accountNumber"
                    placeholder="1234567890123456"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    disabled={usingSavedPayment}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifsc" className="text-sm font-medium">
                    IFSC Code
                  </Label>
                  <Input
                    id="ifsc"
                    placeholder="SBIN0001234"
                    maxLength={11}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    disabled={usingSavedPayment}
                    className="h-11"
                  />
                </div>
              </div>
            </>
          )}

          {!usingSavedPayment && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="save"
                    checked={savePayment}
                    onCheckedChange={(checked) => setSavePayment(checked as boolean)}
                  />
                  <Label
                    htmlFor="save"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Save this payment method for future purchases
                  </Label>
                </div>
                {savePayment && (
                  <Input
                    placeholder="Label (e.g., My Debit Card)"
                    value={paymentLabel}
                    onChange={(e) => setPaymentLabel(e.target.value)}
                    className="h-11"
                  />
                )}
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={onClose}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-11 bg-gradient-to-r from-primary to-primary-glow"
              onClick={handlePayment}
              disabled={processing}
            >
              {processing ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Processing...
                </div>
              ) : (
                `Pay ₹${amount.toFixed(2)}`
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By completing this payment, you agree to our terms of service
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
