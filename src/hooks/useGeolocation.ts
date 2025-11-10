import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface GeoLocation {
  latitude: number;
  longitude: number;
}

interface AddressComponents {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export const useGeolocation = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = (): Promise<GeoLocation> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let errorMessage = "Unable to retrieve your location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please enable location access in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out.";
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const reverseGeocode = async (
    latitude: number,
    longitude: number
  ): Promise<AddressComponents> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch address details");
      }

      const data = await response.json();
      const address = data.address;

      return {
        line1: address.road || address.neighbourhood || "",
        line2: address.suburb || address.hamlet || "",
        city: address.city || address.town || address.village || "",
        state: address.state || "",
        pincode: address.postcode || "",
        country: address.country || "India",
      };
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      throw new Error("Failed to get address from location");
    }
  };

  const getLocationWithAddress = async (): Promise<{
    location: GeoLocation;
    address: AddressComponents;
  }> => {
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      const address = await reverseGeocode(location.latitude, location.longitude);
      
      toast({
        title: "Location detected",
        description: "Please verify and complete the address details",
      });

      return { location, address };
    } catch (error: any) {
      toast({
        title: "Location Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    getCurrentLocation,
    reverseGeocode,
    getLocationWithAddress,
    loading,
  };
};
