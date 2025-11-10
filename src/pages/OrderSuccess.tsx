import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const OrderSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h1 className="mb-2 text-2xl font-bold">Order Placed Successfully!</h1>
          <p className="mb-6 text-muted-foreground">
            Thank you for your order. You will receive a confirmation email shortly.
          </p>
          <div className="space-y-2">
            <Button className="w-full" onClick={() => navigate("/order-history")}>
              View Orders
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard")}>
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSuccess;
