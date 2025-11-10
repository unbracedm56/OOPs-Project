import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle } from "lucide-react";

const PaymentFailed = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <XCircle className="mx-auto mb-4 h-16 w-16 text-destructive" />
          <h1 className="mb-2 text-2xl font-bold">Payment Failed</h1>
          <p className="mb-6 text-muted-foreground">
            Unfortunately, your payment could not be processed. Please try again or use a different payment method.
          </p>
          <div className="space-y-2">
            <Button className="w-full" onClick={() => navigate("/checkout")}>
              Try Again
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFailed;
