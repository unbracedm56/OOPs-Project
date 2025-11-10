import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Loader2 } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LiveLocationAddressFormProps {
  onSuccess: (addressId: string) => void;
  onCancel: () => void;
}

const LiveLocationAddressForm = ({ onSuccess, onCancel }: LiveLocationAddressFormProps) => {
  const { toast } = useToast();
  const { getLocationWithAddress, loading: geoLoading } = useGeolocation();
  const [loading, setLoading] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const handleGetLocation = async () => {
    try {
      const { location, address } = await getLocationWithAddress();
      
      setCoordinates({
        lat: location.latitude,
        lng: location.longitude,
      });

      setFormData({
        label: "Current Location",
        line1: address.line1 || "",
        line2: address.line2 || "",
        city: address.city || "",
        state: address.state || "",
        pincode: address.pincode || "",
        country: address.country || "India",
      });

      setLocationDetected(true);
    } catch (error) {
      console.error("Location error:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("addresses")
        .insert({
          user_id: user.id,
          label: formData.label,
          line1: formData.line1,
          line2: formData.line2 || null,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: formData.country,
          lat: coordinates?.lat || null,
          lng: coordinates?.lng || null,
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Address saved successfully",
      });

      onSuccess(data.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!locationDetected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Use Current Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We'll auto-fill address details based on your current location. You can edit all fields before saving.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleGetLocation}
              disabled={geoLoading}
              className="flex-1"
            >
              {geoLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Detecting Location...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Get My Location
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Your Address</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please verify and complete the auto-filled details. All fields can be edited.
          </p>

          <div className="space-y-2">
            <Label htmlFor="label">Address Label *</Label>
            <Input
              id="label"
              placeholder="Home, Office, etc."
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="line1">
              House/Building Number, Street Name *
            </Label>
            <Textarea
              id="line1"
              placeholder="Enter house/building number and street name"
              value={formData.line1}
              onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
              required
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Auto-filled from location. Please add house/building number if missing.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="line2">Landmark / Area (Optional)</Label>
            <Input
              id="line2"
              placeholder="Nearby landmark or area name"
              value={formData.line2}
              onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                placeholder="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pincode">PIN Code *</Label>
              <Input
                id="pincode"
                placeholder="PIN Code"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                placeholder="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Saving..." : "Save Address & Continue"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LiveLocationAddressForm;
