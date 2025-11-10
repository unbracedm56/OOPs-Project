import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LiveLocationAddressForm from "@/components/LiveLocationAddressForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WarehouseLocationSetupProps {
  storeId: string;
  onComplete: () => void;
}

export const WarehouseLocationSetup = ({ storeId, onComplete }: WarehouseLocationSetupProps) => {
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const { toast } = useToast();

  const handleAddressSaved = async (addressId: string) => {
    try {
      const { error } = await supabase
        .from("stores")
        .update({ warehouse_address_id: addressId })
        .eq("id", storeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Warehouse location has been set successfully",
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            <CardTitle>Set Your Warehouse Location</CardTitle>
          </div>
          <CardDescription>
            Your warehouse location is required to start selling products. This helps customers find products near them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This is a mandatory step. You can edit or change your warehouse location later from your profile settings.
            </AlertDescription>
          </Alert>

          {!useCurrentLocation ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We'll use your current location to auto-fill the address fields. You can edit them before saving.
              </p>
              <Button
                onClick={() => setUseCurrentLocation(true)}
                className="w-full"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Use My Current Location
              </Button>
            </div>
          ) : (
            <LiveLocationAddressForm
              onSuccess={handleAddressSaved}
              onCancel={() => setUseCurrentLocation(false)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
