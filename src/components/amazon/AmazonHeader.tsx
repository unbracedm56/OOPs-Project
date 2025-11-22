import { Search, ShoppingCart, MapPin, Menu, Heart, User, Bell, Package, Navigation, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SearchHistory } from "@/components/SearchHistory";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

interface AmazonHeaderProps {
  cartCount?: number;
  wishlistCount?: number;
  userName?: string;
  onSignOut?: () => void;
  showLocationSelector?: boolean;
  userRole?: string;
}

export const AmazonHeader = ({
  cartCount = 0,
  wishlistCount = 0,
  userName,
  onSignOut,
  showLocationSelector = true,
  userRole,
}: AmazonHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categoryIds, setCategoryIds] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategoryIds();
    fetchSavedAddresses();
    fetchNotificationCount();
    loadUserAndHistory();
    
    // Click outside handler for autocomplete
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    // Subscribe to real-time notification updates
    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => fetchNotificationCount()
      )
      .subscribe();

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      supabase.removeChannel(channel);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
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
      saveToSearchHistory(searchQuery.trim());
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const searchPattern = `%${query}%`;
      
      // For retailers, fetch products from wholesaler inventory only
      if (userRole === "retailer") {
        // First get wholesaler store IDs
        const { data: wholesalerStores, error: storeError } = await supabase
          .from("stores")
          .select("id")
          .eq("type", "wholesaler");

        if (storeError) throw storeError;
        
        const storeIds = wholesalerStores?.map(s => s.id) || [];
        
        if (storeIds.length === 0) {
          setSuggestions([]);
          setShowSuggestions(false);
          setIsSearching(false);
          return;
        }

        // Then get products from those stores
        const { data: inventory, error } = await supabase
          .from("inventory")
          .select(`
            product_id,
            products (
              id,
              name,
              brand,
              images,
              slug,
              description
            )
          `)
          .in("store_id", storeIds)
          .limit(20);

        if (error) throw error;
        
        // Filter by search pattern and remove duplicates
        const uniqueProducts = new Map();
        inventory?.forEach((item: any) => {
          if (item.products) {
            const product = item.products;
            const matchesSearch = 
              product.name?.toLowerCase().includes(query.toLowerCase()) ||
              product.brand?.toLowerCase().includes(query.toLowerCase()) ||
              product.description?.toLowerCase().includes(query.toLowerCase());
            
            if (matchesSearch && !uniqueProducts.has(product.id)) {
              uniqueProducts.set(product.id, {
                id: product.slug || product.id,
                name: product.name,
                brand: product.brand,
                images: product.images
              });
            }
          }
        });
        
        const transformedProducts = Array.from(uniqueProducts.values()).slice(0, 6);
        
        setSuggestions(transformedProducts);
        setShowSuggestions(true);
      } else {
        // For customers, fetch products from retailer inventory only
        const { data: retailerStores, error: storeError } = await supabase
          .from("stores")
          .select("id")
          .eq("type", "retailer");

        if (storeError) throw storeError;
        
        const storeIds = retailerStores?.map(s => s.id) || [];
        
        if (storeIds.length === 0) {
          setSuggestions([]);
          setShowSuggestions(false);
          setIsSearching(false);
          return;
        }

        // Then get products from those stores
        const { data: inventory, error } = await supabase
          .from("inventory")
          .select(`
            product_id,
            products (
              id,
              name,
              brand,
              images,
              slug,
              description
            )
          `)
          .in("store_id", storeIds)
          .limit(20);

        if (error) throw error;
        
        // Filter by search pattern and remove duplicates
        const uniqueProducts = new Map();
        inventory?.forEach((item: any) => {
          if (item.products) {
            const product = item.products;
            const matchesSearch = 
              product.name?.toLowerCase().includes(query.toLowerCase()) ||
              product.brand?.toLowerCase().includes(query.toLowerCase()) ||
              product.description?.toLowerCase().includes(query.toLowerCase());
            
            if (matchesSearch && !uniqueProducts.has(product.id)) {
              uniqueProducts.set(product.id, {
                id: product.slug || product.id,
                name: product.name,
                brand: product.brand,
                images: product.images
              });
            }
          }
        });
        
        const transformedProducts = Array.from(uniqueProducts.values()).slice(0, 6);
        
        setSuggestions(transformedProducts);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced search
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300); // 300ms debounce
  };

  const handleSuggestionClick = (productId: string) => {
    navigate(`/product/${productId}`);
    setShowSuggestions(false);
    setSearchQuery("");
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const loadUserAndHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      await loadSearchHistory(user.id);
    }
  };

  const loadSearchHistory = async (uid: string) => {
    const searchContext = userRole === 'retailer' ? 'wholesaler-marketplace' : 'customer-dashboard';
    const { data, error } = await supabase
      .from("search_history")
      .select("search_query")
      .eq("user_id", uid)
      .eq("search_context", searchContext)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      const uniqueQueries = [...new Set(data.map(item => item.search_query))];
      setSearchHistory(uniqueQueries);
    }
  };

  const saveToSearchHistory = async (searchTerm: string) => {
    if (!searchTerm.trim() || !userId) return;

    const searchContext = userRole === 'retailer' ? 'wholesaler-marketplace' : 'customer-dashboard';
    await supabase
      .from("search_history")
      .insert({
        user_id: userId,
        search_query: searchTerm,
        search_context: searchContext,
      });

    // Update local state
    const newHistory = [
      searchTerm,
      ...searchHistory.filter(item => item !== searchTerm),
    ].slice(0, 10);
    setSearchHistory(newHistory);
  };

  const removeFromHistory = async (searchTerm: string) => {
    if (!userId) return;
    
    const searchContext = userRole === 'retailer' ? 'wholesaler-marketplace' : 'customer-dashboard';
    await supabase
      .from("search_history")
      .delete()
      .eq("user_id", userId)
      .eq("search_query", searchTerm)
      .eq("search_context", searchContext);

    setSearchHistory(searchHistory.filter(item => item !== searchTerm));
  };

  const fetchNotificationCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (!error) {
      setNotificationCount(count || 0);
    }
  };

  const extractFirstImage = (images: string | null): string => {
    if (!images) return "/placeholder.svg";
    
    try {
      const imageArray = JSON.parse(images);
      return Array.isArray(imageArray) && imageArray.length > 0
        ? imageArray[0]
        : "/placeholder.svg";
    } catch {
      return images || "/placeholder.svg";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate("/dashboard")}
          >
            <img
              src="/logos/blitz-bazaar-light.jpg"
              alt="Blitz Bazaar"
              className="h-12 md:h-14 w-auto object-contain dark:hidden"
            />
            <img
              src="/logos/blitz-bazaar-dark.jpg"
              alt="Blitz Bazaar"
              className="h-12 md:h-14 w-auto object-contain hidden dark:block"
            />
          </div>

          {/* Search Bar - Center */}
          <div className="flex-1 max-w-2xl mx-4" ref={searchRef}>
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  type="text"
                  placeholder="Search products, brands, and more..."
                  className="pl-10 pr-10 h-11 rounded-full border-2 focus-visible:ring-primary"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => {
                    setShowSuggestions(true);
                  }}
                  onClick={() => setShowSuggestions(true)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-muted rounded-full p-1 z-10"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}

                {/* Autocomplete Dropdown */}
                {showSuggestions && (
                  <Card className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto shadow-lg z-50">
                    {isSearching ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Searching...
                      </div>
                    ) : searchHistory.length > 0 && !searchQuery.trim() ? (
                      <div className="py-2">
                        <div className="flex items-center justify-between px-4 py-2">
                          <span className="text-xs font-semibold text-muted-foreground">Recent Searches</span>
                        </div>
                        {searchHistory.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between px-4 py-3 hover:bg-muted cursor-pointer transition-colors group"
                          >
                            <div
                              className="flex items-center gap-3 flex-1"
                              onClick={() => {
                                setSearchQuery(item);
                                saveToSearchHistory(item);
                                setShowSuggestions(false);
                                navigate(`/search?q=${encodeURIComponent(item)}`);
                              }}
                            >
                              <Search className="h-4 w-4 text-muted-foreground" />
                              <span>{item}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromHistory(item);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : suggestions.length > 0 ? (
                      <div className="py-2">
                        {suggestions.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleSuggestionClick(product.id)}
                            className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer transition-colors"
                          >
                            {product.images ? (
                              <img
                                src={extractFirstImage(product.images)}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded border"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{product.name}</div>
                              {product.brand && (
                                <div className="text-sm text-muted-foreground truncate">
                                  {product.brand}
                                </div>
                              )}
                            </div>
                            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                        ))}
                        {searchQuery.trim() && (
                          <>
                            <div className="border-t my-2"></div>
                            <div
                              onClick={() => {
                                handleSearch({ preventDefault: () => {} } as React.FormEvent);
                              }}
                              className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer transition-colors text-primary font-medium"
                            >
                              <Search className="h-4 w-4" />
                              <span>See all results for "{searchQuery}"</span>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No products found
                      </div>
                    )}
                  </Card>
                )}
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
              onClick={() => navigate("/notifications")}
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center bg-accent text-white text-xs px-1">
                  {notificationCount}
                </Badge>
              )}
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
