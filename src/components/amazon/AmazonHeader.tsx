import { Search, ShoppingCart, MapPin, Menu, Heart, User, Bell, Package, Navigation, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface AmazonHeaderProps {
  cartCount?: number;
  wishlistCount?: number;
  userName?: string;
  onSignOut?: () => void;
  showLocationSelector?: boolean;
}

export const AmazonHeader = ({
  cartCount = 0,
  wishlistCount = 0,
  userName,
  onSignOut,
  showLocationSelector = true,
}: AmazonHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categoryIds, setCategoryIds] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  useEffect(() => {
    fetchCategoryIds();
    fetchSavedAddresses();
  }, []);

  const fetchSavedAddresses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      setSavedAddresses(data || []);
      
      // Set default address as selected
      const defaultAddr = data?.find(addr => addr.is_default);
      if (defaultAddr) setSelectedAddress(defaultAddr);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  const handleUseLiveLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSelectedAddress({
          street_address: "Current Location",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        toast({
          title: "Location updated",
          description: "Using your current location",
        });
      },
      (error) => {
        toast({
          title: "Error",
          description: "Unable to get your location",
          variant: "destructive",
        });
      }
    );
  };

  useEffect(() => {
    fetchCategoryIds();
  }, []);

  const fetchCategoryIds = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .is("parent_id", null);

    if (data) {
      const idMap: Record<string, string> = {};
      data.forEach((cat) => {
        const name = cat.name.toLowerCase();
        if (name.includes("electronic")) {
          idMap.electronics = cat.id;
        } else if (name.includes("fashion") || name.includes("clothing")) {
          idMap.fashion = cat.id;
        } else if (name.includes("home") || name.includes("kitchen")) {
          idMap.homeKitchen = cat.id;
        }
      });
      setCategoryIds(idMap);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate("/dashboard")}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:shadow-lg transition-shadow">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="hidden md:block">
              <div className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                LocalMart
              </div>
              <div className="text-xs text-muted-foreground">Shop Local, Save More</div>
            </div>
          </div>

          {/* Search Bar - Center */}
          <div className="flex-1 max-w-2xl mx-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products, brands, and more..."
                  className="pl-10 pr-4 h-11 rounded-full border-2 focus-visible:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Location */}
            {showLocationSelector && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden lg:flex items-center gap-2 hover:bg-muted"
                  >
                    <MapPin className="h-4 w-4" />
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">Deliver to</div>
                      <div className="text-sm font-semibold truncate max-w-[120px]">
                        {selectedAddress 
                          ? selectedAddress.street_address || selectedAddress.city || "Current Location"
                          : "Select Location"}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Select Delivery Location</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Use Live Location */}
                  <DropdownMenuItem onClick={handleUseLiveLocation} className="cursor-pointer">
                    <Navigation className="mr-2 h-4 w-4" />
                    <div>
                      <div className="font-medium">Use Live Location</div>
                      <div className="text-xs text-muted-foreground">Get current location</div>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Saved Addresses */}
                  {savedAddresses.length > 0 && (
                    <>
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        Saved Addresses
                      </DropdownMenuLabel>
                      {savedAddresses.map((address) => (
                        <DropdownMenuItem
                          key={address.id}
                          onClick={() => setSelectedAddress(address)}
                          className="cursor-pointer"
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {address.label || "Address"}
                              {address.is_default && (
                                <Badge variant="secondary" className="text-xs">Default</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {address.street_address}, {address.city}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  {/* Add New Address */}
                  <DropdownMenuItem 
                    onClick={() => navigate("/profile?section=addresses")}
                    className="cursor-pointer text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <div>
                      <div className="font-medium">Add New Address</div>
                      <div className="text-xs text-muted-foreground">Manage addresses</div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-muted"
            >
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center bg-accent text-white text-xs px-1">
                3
              </Badge>
            </Button>

            {/* Wishlist */}
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-muted"
              onClick={() => navigate("/wishlist")}
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center bg-secondary text-white text-xs px-1">
                  {wishlistCount}
                </Badge>
              )}
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-muted"
              onClick={() => navigate("/cart")}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center bg-primary text-white text-xs px-1">
                  {cartCount}
                </Badge>
              )}
            </Button>

            {/* Account Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{userName || "Guest"}</p>
                    <p className="text-xs text-muted-foreground">Manage your account</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/orders")}>
                  <Package className="mr-2 h-4 w-4" />
                  My Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile?section=addresses")}>
                  <MapPin className="mr-2 h-4 w-4" />
                  Addresses
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {onSignOut && (
                  <DropdownMenuItem onClick={onSignOut} className="text-destructive">
                    Sign Out
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6 h-12 overflow-x-auto scrollbar-hide">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2 hover:text-primary"
              onClick={() => navigate('/categories')}
            >
              <Menu className="h-4 w-4" />
              <span className="font-semibold">All Categories</span>
            </Button>
            <button 
              className="text-sm hover:text-primary transition-colors whitespace-nowrap"
              onClick={() => navigate('/category/deals')}
            >
              Today's Deals
            </button>
            <button 
              className="text-sm hover:text-primary transition-colors whitespace-nowrap"
              onClick={() => categoryIds.electronics && navigate(`/category/${categoryIds.electronics}`)}
            >
              Electronics
            </button>
            <button 
              className="text-sm hover:text-primary transition-colors whitespace-nowrap"
              onClick={() => categoryIds.fashion && navigate(`/category/${categoryIds.fashion}`)}
            >
              Fashion
            </button>
            <button 
              className="text-sm hover:text-primary transition-colors whitespace-nowrap"
              onClick={() => categoryIds.homeKitchen && navigate(`/category/${categoryIds.homeKitchen}`)}
            >
              Home & Kitchen
            </button>
            <button 
              className="text-sm hover:text-primary transition-colors whitespace-nowrap"
              onClick={() => navigate('/category/new-arrivals')}
            >
              New Arrivals
            </button>
            <button 
              className="text-sm hover:text-primary transition-colors whitespace-nowrap"
              onClick={() => navigate('/category/best-sellers')}
            >
              Best Sellers
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
