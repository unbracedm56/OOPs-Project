import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SignOutDialog } from "@/components/SignOutDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { Search, ShoppingCart, Package, Users, TrendingUp, Plus, MapPin, ListOrdered, UserCircle, LogOut } from "lucide-react";
import { WarehouseLocationSetup } from "@/components/WarehouseLocationSetup";
import { useLocationFilter } from "@/hooks/useLocationFilter";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

export default function RetailerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [myInventory, setMyInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [locationFilterEnabled, setLocationFilterEnabled] = useState(false);
  const [maxDistance, setMaxDistance] = useState(50);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const { filterByLocation, loading: locationLoading, error: locationError, userLocation } = useLocationFilter({ 
    maxDistance, 
    enabled: locationFilterEnabled 
  });

  // Calculate actual min and max prices from products
  const { minPrice, maxPrice } = useMemo(() => {
    if (products.length === 0) return { minPrice: 0, maxPrice: 10000 };
    const prices = products.map(item => Number(item.price));
    return {
      minPrice: Math.floor(Math.min(...prices)),
      maxPrice: Math.ceil(Math.max(...prices))
    };
  }, [products]);

  // Reset price range when products change
  useEffect(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (store) {
      fetchWholesalerProducts();
    }
  }, [locationFilterEnabled, maxDistance, userLocation]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData?.role !== "retailer") {
        navigate("/dashboard");
        return;
      }

      setUser(user);
      setProfile(profileData);

      // Get or create store
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .eq("type", "retailer")
        .single();

      setStore(storeData);
      
      if (storeData) {
        fetchWholesalerProducts();
        fetchMyInventory(storeData.id);
        fetchCartCount();
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error checking user:", error);
      setLoading(false);
    }
  };

  const fetchWholesalerProducts = async () => {
    try {
      // RLS policy automatically filters to show only wholesaler products
      // that are NOT in the retailer's inventory
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          *,
          products:product_id (
            *,
            categories:category_id (*)
          ),
          stores:store_id (name, type)
        `)
        .eq("is_active", true)
        .gt("stock_qty", 0);

      if (error) throw error;
      
      // Filter to only show wholesaler products (extra safety check)
      const wholesalerOnly = (data || []).filter(item => item.stores?.type === 'wholesaler');
      
      // Apply location-based filtering if enabled
      if (locationFilterEnabled && userLocation) {
        console.log("Applying location filter for retailer with user location:", userLocation);
        console.log("Products before filtering:", wholesalerOnly.length);
        const filtered = await filterByLocation(wholesalerOnly, "store_id");
        console.log("Products after filtering:", filtered.length);
        setProducts(filtered);
      } else {
        if (locationFilterEnabled && !userLocation) {
          console.log("Location filter enabled but user location not available yet");
        }
        setProducts(wholesalerOnly);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchMyInventory = async (storeId: string) => {
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          *,
          products:product_id (*)
        `)
        .eq("store_id", storeId);

      if (error) throw error;
      setMyInventory(data || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  const fetchCartCount = async () => {
    try {
      if (!user) return;
      const { data: cart } = await supabase
        .from("cart")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (cart) {
        const { count } = await supabase
          .from("cart_items")
          .select("*", { count: "exact", head: true })
          .eq("cart_id", cart.id);
        setCartCount(count || 0);
      }
    } catch (error) {
      console.error("Error fetching cart count:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
    navigate("/");
  };

  const filteredProducts = products.filter((item) => {
    const matchesSearch = item.products?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = Number(item.price) >= priceRange[0] && Number(item.price) <= priceRange[1];
    return matchesSearch && matchesPrice;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show warehouse location setup if not configured
  if (store && !store.warehouse_address_id) {
    return <WarehouseLocationSetup storeId={store.id} onComplete={checkUser} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Retailer Dashboard</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/cart")}>
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">
                    {cartCount}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/order-history")}>
                <ListOrdered className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
                <UserCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowSignOutDialog(true)}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">My Inventory</p>
                  <p className="text-2xl font-bold">{myInventory.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Customers</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <ShoppingCart className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Orders</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">₹0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Button size="lg" onClick={() => navigate("/retailer/inventory")} className="h-20">
            <Package className="mr-2 h-5 w-5" />
            Manage Inventory
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/view-customers")} className="h-20">
            <Users className="mr-2 h-5 w-5" />
            View Customers
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/order-history")} className="h-20">
            <ShoppingCart className="mr-2 h-5 w-5" />
            View Orders
          </Button>
        </div>

        {/* Search Bar and Filters */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Search wholesaler products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Location Filter Card */}
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <Label htmlFor="location-filter" className="font-semibold">
                  Filter by Location
                </Label>
                <Switch
                  id="location-filter"
                  checked={locationFilterEnabled}
                  onCheckedChange={setLocationFilterEnabled}
                />
              </div>
              
              {locationFilterEnabled && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="max-distance" className="text-sm whitespace-nowrap">
                    Within:
                  </Label>
                  <Select value={maxDistance.toString()} onValueChange={(v) => setMaxDistance(Number(v))}>
                    <SelectTrigger id="max-distance" className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 km</SelectItem>
                      <SelectItem value="25">25 km</SelectItem>
                      <SelectItem value="50">50 km</SelectItem>
                      <SelectItem value="100">100 km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {locationFilterEnabled && locationLoading && (
                <span className="text-xs text-muted-foreground">Getting location...</span>
              )}
              
              {locationFilterEnabled && locationError && (
                <span className="text-xs text-destructive">{locationError}</span>
              )}
              
              {locationFilterEnabled && userLocation && !locationLoading && (
                <span className="text-xs text-muted-foreground">Location enabled</span>
              )}
            </div>
          </Card>
          </div>
          
          {/* Price Filter Card */}
          <Card className="p-4">
            <div className="space-y-3">
              <Label className="font-semibold">Price Range</Label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground min-w-[60px]">₹{priceRange[0]}</span>
                <Slider
                  min={minPrice}
                  max={maxPrice}
                  step={100}
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground min-w-[60px] text-right">₹{priceRange[1]}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Products from Wholesalers */}
        <div>
          <h2 className="text-xl font-bold mb-4">Available from Wholesalers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/product/${item.products?.slug}`)}>
                <div className="aspect-square overflow-hidden bg-muted">
                  {item.products?.images?.[0] && (
                    <img
                      src={item.products.images[0]}
                      alt={item.products.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{item.products?.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{item.stores?.name}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold">₹{item.price}</p>
                      {item.mrp && item.mrp > item.price && (
                        <p className="text-sm text-muted-foreground line-through">₹{item.mrp}</p>
                      )}
                    </div>
                    <Badge variant={item.stock_qty > 10 ? "default" : "destructive"}>
                      {item.stock_qty} in stock
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Delivery: {item.delivery_days} days
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <SignOutDialog
        open={showSignOutDialog}
        onOpenChange={setShowSignOutDialog}
        onConfirm={handleSignOut}
      />
    </div>
  );
}
