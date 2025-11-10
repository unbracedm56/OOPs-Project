import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { ShoppingCart, ListOrdered, UserCircle, LogOut, Heart, Mail, Search, MapPin } from "lucide-react";
import { SignOutDialog } from "@/components/SignOutDialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect as useRealtimeEffect } from "react";
import { useLocationFilter } from "@/hooks/useLocationFilter";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
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
    fetchCategories();
  }, []);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [selectedCategory, locationFilterEnabled, maxDistance, userLocation]);

  useEffect(() => {
    if (user) {
      fetchWishlistCount();
      fetchCartCount();
      
      // Subscribe to wishlist changes
      const wishlistChannel = supabase
        .channel('wishlist-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wishlist',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchWishlistCount();
          }
        )
        .subscribe();

      // Subscribe to cart changes
      const cartChannel = supabase
        .channel('cart-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cart_items'
          },
          () => {
            fetchCartCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(wishlistChannel);
        supabase.removeChannel(cartChannel);
      };
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    setUser(user);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileData?.role !== "customer") {
      navigate("/dashboard");
      return;
    }

    setProfile(profileData);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .is("parent_id", null)
      .order("name");
    
    if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    let query = supabase
      .from("inventory")
      .select(`
        id,
        price,
        mrp,
        stock_qty,
        is_active,
        delivery_days,
        products:product_id (
          id,
          name,
          slug,
          description,
          images,
          brand,
          categories:category_id (
            id,
            name
          )
        ),
        stores:store_id (
          id,
          name,
          type
        )
      `)
      .eq("is_active", true)
      .gt("stock_qty", 0)
      .order("created_at", { ascending: false });

    const { data, error } = await query.limit(100);
    
    if (error) {
      console.error("Error fetching products:", error);
      return;
    }
    
    if (data) {
      // Filter to show only retailer products
      let retailerProducts = data.filter(item => {
        return item.products !== null && item.stores?.type === 'retailer';
      });
      
      // Apply category filter if selected
      if (selectedCategory) {
        retailerProducts = retailerProducts.filter(item =>
          item.products?.categories?.id === selectedCategory
        );
      }
      
      // Apply location-based filtering if enabled
      if (locationFilterEnabled && userLocation) {
        console.log("Applying location filter with user location:", userLocation);
        console.log("Products before filtering:", retailerProducts.length);
        const filtered = await filterByLocation(retailerProducts, "stores.id");
        console.log("Products after filtering:", filtered.length);
        setProducts(filtered);
      } else {
        if (locationFilterEnabled && !userLocation) {
          console.log("Location filter enabled but user location not available yet");
        }
        setProducts(retailerProducts);
      }
    }
  };

  const fetchWishlistCount = async () => {
    if (!user) return;
    
    const { count } = await supabase
      .from("wishlist")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", user.id);
    
    setWishlistCount(count || 0);
  };

  const fetchCartCount = async () => {
    if (!user) return;
    
    const { data: cart } = await supabase
      .from("cart")
      .select("id")
      .eq("user_id", user.id)
      .single();
    
    if (!cart) {
      setCartCount(0);
      return;
    }
    
    const { data: items } = await supabase
      .from("cart_items")
      .select("qty")
      .eq("cart_id", cart.id);
    
    const totalQty = items?.reduce((sum, item) => sum + item.qty, 0) || 0;
    setCartCount(totalQty);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowSignOutDialog(false);
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/");
  };

  const filteredProducts = products.filter((item) => {
    const matchesSearch = item.products && item.products.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = Number(item.price) >= priceRange[0] && Number(item.price) <= priceRange[1];
    return matchesSearch && matchesPrice;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            LocalMart
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/wishlist")}>
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">
                  {wishlistCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/cart")}>
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">
                  {cartCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/orders")}>
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
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.full_name}!
          </h2>
          <p className="text-muted-foreground">
            Discover products from local stores near you
          </p>
        </div>

        {/* Search Bar and Filters */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
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

        {/* Categories Filter */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Shop by Category</h3>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer px-4 py-2"
              onClick={() => setSelectedCategory(null)}
            >
              All Products
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className="cursor-pointer px-4 py-2"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {selectedCategory ? "Filtered Products" : "Recommended for You"}
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((item) => {
              const product = item.products;
              const images = Array.isArray(product.images) ? product.images : [];
              
              // Clean and convert image URLs
              const cleanImageUrl = (url: string) => {
                if (!url) return "/placeholder.svg";
                // Remove escaped quotes and extra whitespace
                let cleaned = url.replace(/^["']|["']$/g, '').trim();
                // Convert HTTP to HTTPS
                cleaned = cleaned.replace(/^http:/, 'https:');
                return cleaned;
              };
              
              const imageUrl = images.length > 0 ? cleanImageUrl(images[0]) : "/placeholder.svg";
              
              return (
                <Card
                  key={item.id}
                  className="hover:shadow-elegant transition-shadow cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/product/${product.slug}`)}
                >
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="object-cover w-full h-full hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                    {item.mrp && item.mrp > item.price && (
                      <Badge className="absolute top-2 right-2 bg-destructive">
                        {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base line-clamp-2">
                      {product.name}
                    </CardTitle>
                    {product.brand && (
                      <p className="text-sm text-muted-foreground">{product.brand}</p>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-xl font-bold">₹{item.price}</span>
                      {item.mrp && item.mrp > item.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          ₹{item.mrp}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Sold by {item.stores.name}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {item.stock_qty > 10 ? "In Stock" : `Only ${item.stock_qty} left`}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found{searchQuery ? " matching your search" : " in this category"}.</p>
            </div>
          )}
        </div>

        <SignOutDialog
          open={showSignOutDialog}
          onOpenChange={setShowSignOutDialog}
          onConfirm={handleSignOut}
        />
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-semibold mb-3">Quick Links</h3>
              <div className="flex flex-col gap-2">
                <Button variant="link" className="justify-start p-0 h-auto" onClick={() => navigate("/orders")}>
                  Order History
                </Button>
                <Button variant="link" className="justify-start p-0 h-auto" onClick={() => navigate("/wishlist")}>
                  My Wishlist
                </Button>
                <Button variant="link" className="justify-start p-0 h-auto" onClick={() => navigate("/saved-addresses")}>
                  Saved Addresses
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Support</h3>
              <div className="flex flex-col gap-2">
                <Button variant="link" className="justify-start p-0 h-auto" onClick={() => navigate("/contact")}>
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Us
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">About</h3>
              <p className="text-sm text-muted-foreground">
                LocalMart connects you with local stores for fast, convenient shopping.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerDashboard;
