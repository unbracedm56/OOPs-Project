import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, X, MapPin, Navigation } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useToast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface ProductFiltersProps {
  minPrice: number;
  maxPrice: number;
  onMinPriceChange: (value: number) => void;
  onMaxPriceChange: (value: number) => void;
  inStockOnly: boolean;
  onInStockChange: (value: boolean) => void;
  location: string;
  onLocationChange: (value: string) => void;
  onUserLocationChange?: (lat: number, lng: number) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const ProductFilters = ({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  inStockOnly,
  onInStockChange,
  location,
  onLocationChange,
  onUserLocationChange,
  onClearFilters,
  hasActiveFilters,
}: ProductFiltersProps) => {
  const { toast } = useToast();
  const { getCurrentLocation, reverseGeocode } = useGeolocation();
  const [priceRange, setPriceRange] = useState([minPrice, maxPrice]);
  const [isPriceOpen, setIsPriceOpen] = useState(true);
  const [isStockOpen, setIsStockOpen] = useState(true);
  const [isLocationOpen, setIsLocationOpen] = useState(true);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  // Sync local price range state with props
  useEffect(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  const handlePriceChange = (values: number[]) => {
    setPriceRange(values);
  };

  const applyPriceFilter = () => {
    onMinPriceChange(priceRange[0]);
    onMaxPriceChange(priceRange[1]);
  };

  const handleGetLiveLocation = async () => {
    setFetchingLocation(true);
    try {
      const coords = await getCurrentLocation();
      const address = await reverseGeocode(coords.latitude, coords.longitude);
      
      // Pass coordinates to parent component
      if (onUserLocationChange) {
        onUserLocationChange(coords.latitude, coords.longitude);
      }
      
      if (address.city || address.pincode) {
        const locationString = address.city || address.pincode || "";
        onLocationChange(locationString);
        toast({
          title: "Location detected",
          description: `Using location: ${locationString}`,
        });
      } else {
        toast({
          title: "Location unavailable",
          description: "Could not determine your location. Please enter manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Location error",
        description: error instanceof Error ? error.message : "Failed to get location",
        variant: "destructive",
      });
    } finally {
      setFetchingLocation(false);
    }
  };

  return (
    <Card className="p-4 sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 px-2 text-xs"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Price Range Filter */}
        <Collapsible open={isPriceOpen} onOpenChange={setIsPriceOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded px-2">
            <Label className="font-medium cursor-pointer">Price Range</Label>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isPriceOpen ? "transform rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-2">
            <div className="space-y-4">
              <Slider
                min={0}
                max={10000}
                step={100}
                value={priceRange}
                onValueChange={handlePriceChange}
                className="w-full"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setPriceRange([val, priceRange[1]]);
                  }}
                  className="h-8 text-sm"
                  placeholder="Min"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 10000;
                    setPriceRange([priceRange[0], val]);
                  }}
                  className="h-8 text-sm"
                  placeholder="Max"
                />
              </div>
              <div className="text-sm text-muted-foreground text-center">
                ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
              </div>
              <Button
                onClick={applyPriceFilter}
                size="sm"
                className="w-full"
                variant="outline"
              >
                Apply
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Stock Availability Filter */}
        <Collapsible open={isStockOpen} onOpenChange={setIsStockOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded px-2">
            <Label className="font-medium cursor-pointer">Availability</Label>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isStockOpen ? "transform rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="in-stock"
                checked={inStockOnly}
                onCheckedChange={(checked) => onInStockChange(checked === true)}
              />
              <label
                htmlFor="in-stock"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                In Stock Only
              </label>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Location Filter */}
        <Collapsible open={isLocationOpen} onOpenChange={setIsLocationOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded px-2">
            <Label className="font-medium cursor-pointer">Location</Label>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isLocationOpen ? "transform rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-2">
            <div className="space-y-3">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter city or pincode"
                  value={location}
                  onChange={(e) => onLocationChange(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={handleGetLiveLocation}
                disabled={fetchingLocation}
                size="sm"
                variant="outline"
                className="w-full"
              >
                <Navigation className="h-4 w-4 mr-2" />
                {fetchingLocation ? "Detecting..." : "Use Current Location"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Filter products by store location
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
};
