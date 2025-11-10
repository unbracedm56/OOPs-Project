import { useState, useEffect } from "react";
import { useGeolocation } from "./useGeolocation";
import { supabase } from "@/integrations/supabase/client";

interface LocationFilterOptions {
  maxDistance?: number; // in kilometers
  enabled?: boolean;
}

export const useLocationFilter = (options: LocationFilterOptions = {}) => {
  const { maxDistance = 50, enabled = true } = options;
  const { getCurrentLocation } = useGeolocation();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (enabled) {
      loadUserLocation();
    }
  }, [enabled]);

  const loadUserLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
    } catch (err: any) {
      setError(err.message);
      console.error("Location error:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filterByLocation = async <T extends Record<string, any>>(
    items: T[],
    storeIdKey: string = "store_id"
  ): Promise<T[]> => {
    if (!userLocation || !enabled) {
      return items;
    }

    try {
      // Get unique store IDs using the provided key
      const storeIds = [...new Set(items.map(item => {
        // Support nested paths like "stores.id"
        const keys = storeIdKey.split('.');
        let value = item;
        for (const key of keys) {
          value = value?.[key];
        }
        return value;
      }).filter(Boolean))];

      // Fetch warehouse locations for all stores
      const { data: stores, error: storesError } = await supabase
        .from("stores")
        .select(`
          id,
          warehouse_address_id,
          addresses:warehouse_address_id (
            lat,
            lng
          )
        `)
        .in("id", storeIds as unknown as string[])
        .not("warehouse_address_id", "is", null);

      if (storesError) throw storesError;

      // Create a map of store distances
      const storeDistances = new Map<string, number>();
      
      console.log("User location:", userLocation);
      console.log("Stores with warehouse addresses:", stores);
      
      stores?.forEach((store: any) => {
        if (store.addresses?.lat && store.addresses?.lng) {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            parseFloat(store.addresses.lat),
            parseFloat(store.addresses.lng)
          );
          console.log(`Store ${store.id} distance: ${distance.toFixed(2)} km`);
          storeDistances.set(store.id, distance);
        } else {
          console.log(`Store ${store.id} has no warehouse address`);
        }
      });
      
      console.log(`Max distance filter: ${maxDistance} km`);

      // Filter items by distance
      const filtered = items.filter(item => {
        const keys = storeIdKey.split('.');
        let value: any = item;
        for (const key of keys) {
          value = value?.[key];
        }
        const storeId = value as string;
        const distance = storeDistances.get(storeId);
        const isWithinRange = distance !== undefined && distance <= maxDistance;
        
        if (!isWithinRange && distance !== undefined) {
          console.log(`Store ${storeId} filtered out: ${distance.toFixed(2)} km > ${maxDistance} km`);
        }
        
        return isWithinRange;
      });
      
      console.log(`Filtered ${items.length} items to ${filtered.length} items`);
      return filtered;
    } catch (err) {
      console.error("Error filtering by location:", err);
      return items;
    }
  };

  return {
    userLocation,
    loading,
    error,
    filterByLocation,
    refreshLocation: loadUserLocation,
  };
};
