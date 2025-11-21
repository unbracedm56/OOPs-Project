import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AmazonHeader, AmazonFooter, AmazonProductCard } from "@/components/amazon";
import { ProductFilters } from "@/components/ProductFilters";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { Layers } from "lucide-react";

const CategoryPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [location, setLocation] = useState("");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user && categoryId) {
      fetchCategory();
      fetchProducts();
      fetchWishlistCount();
      fetchCartCount();
    }
  }, [user, categoryId, userLat, userLng]);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
    }
  };

  const fetchCategory = async () => {
    if (!categoryId) return;

    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("id", categoryId)
      .single();

    if (data) setCategory(data);
  };

  const fetchProducts = async () => {
    if (!categoryId) {
      setLoading(false);
      return;
    }

    try {
      // Build the query
      let query = supabase
        .from("inventory")
        .select(
          `
          id,
          price,
          mrp,
          stock_qty,
          is_active,
          store_id,
          products:product_id (
            id,
            name,
            slug,
            description,
            images,
            brand,
            category_id
          )
        `
        )
        .eq("is_active", true)
        .gt("stock_qty", 0)
        .eq("products.category_id", categoryId)
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        // Get unique store IDs
        const storeIds = [...new Set(data.map(item => item.store_id).filter(Boolean))];
        
        // Fetch stores with addresses
        let storesQuery = supabase
          .from("stores")
          .select(`
            id,
            name,
            type,
            address_id,
            addresses:address_id (
              lat,
              lng,
              city,
              pincode
            )
          `)
          .in("id", storeIds);
        
        // Filter by store type based on user role
        if (profile?.role === "customer") {
          storesQuery = storesQuery.eq("type", "retailer");
        } else if (profile?.role === "retailer") {
          storesQuery = storesQuery.eq("type", "wholesaler");
        }

        const { data: storesData } = await storesQuery;

        // Create a map of stores by ID
        const storesMap = new Map(storesData?.map(store => [store.id, store]) || []);

        // Map products with store data and calculate distances
        // Filter out products from non-matching store types
        const productsWithDistance = data
          .filter((item) => {
            if (!item.products) return false;
            // For customers, only show retailer products
            // For retailers, only show wholesaler products
            if (profile?.role === "customer" || profile?.role === "retailer") {
              return storesMap.has(item.store_id);
            }
            return true;
          })
          .map((item) => {
            const store = storesMap.get(item.store_id);
            const storeAddress = store?.addresses;
            let distance = undefined;
            
            if (userLat && userLng && storeAddress?.lat && storeAddress?.lng) {
              distance = calculateDistance(
                userLat,
                userLng,
                Number(storeAddress.lat),
                Number(storeAddress.lng)
              );
            }
            
            return {
              ...item,
              store: store ? {
                id: store.id,
                name: store.name,
                address: storeAddress ? {
                  lat: Number(storeAddress.lat),
                  lng: Number(storeAddress.lng),
                  city: storeAddress.city,
                  pincode: storeAddress.pincode,
                } : undefined,
              } : undefined,
              distance,
            };
          });
        
        setProducts(productsWithDistance);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlistCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from("wishlist")
      .select("*", { count: "exact", head: true })
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

  const sanitizeImageUrl = (url: string | null | undefined) => {
    if (!url) return "/placeholder.svg";
    return url.replace(/^http:/, "https:") || "/placeholder.svg";
  };

  const extractFirstImage = (images: any): string => {
    if (!images) return "/placeholder.svg";
    if (Array.isArray(images) && images.length > 0) {
      return sanitizeImageUrl(typeof images[0] === "string" ? images[0] : images[0]?.url);
    }
    return "/placeholder.svg";
  };

  const applyFilters = () => {
    let filtered = [...products];
    
    // Filter by price range
    filtered = filtered.filter(item => {
      const price = item.price || 0;
      return price >= minPrice && price <= maxPrice;
    });
    
    // Filter by stock availability
    if (inStockOnly) {
      filtered = filtered.filter(item => (item.stock_qty || 0) > 0);
    }
    
    // Location filter - sort by distance without removing products
    if (location.trim() && userLat && userLng) {
      // Sort by distance - closest stores first
      filtered = filtered.sort((a, b) => {
        const distA = a.distance ?? Infinity;
        const distB = b.distance ?? Infinity;
        return distA - distB;
      });
    }
    
    setFilteredProducts(filtered);
  };

  const handleClearFilters = () => {
    setMinPrice(0);
    setMaxPrice(10000);
    setInStockOnly(false);
    setLocation("");
    setUserLat(null);
    setUserLng(null);
  };

  const hasActiveFilters = minPrice > 0 || maxPrice < 10000 || inStockOnly || location.trim() !== "";

  // Apply filters whenever filter values or products change
  useEffect(() => {
    applyFilters();
  }, [minPrice, maxPrice, inStockOnly, location, products]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AmazonHeader
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        userName={profile?.full_name?.split(" ")[0]}
        onSignOut={handleSignOut}
      />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center gap-4">
            {category?.image_url ? (
              <div className="h-20 w-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                <img 
                  src={sanitizeImageUrl(category.image_url)} 
                  alt={category.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary"><svg class="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg></div>';
                  }}
                />
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary">
                <Layers className="h-8 w-8 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {category?.name || "Category"}
              </h1>
              <p className="text-muted-foreground">
                {category?.description || "Browse products in this category"}
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Filters Sidebar */}
            {filteredProducts.length > 0 && (
              <div className="hidden lg:block w-64 flex-shrink-0">
                <ProductFilters
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  inStockOnly={inStockOnly}
                  location={location}
                  onMinPriceChange={setMinPrice}
                  onMaxPriceChange={setMaxPrice}
                  onInStockChange={setInStockOnly}
                  onLocationChange={setLocation}
                  onUserLocationChange={(lat, lng) => {
                    setUserLat(lat);
                    setUserLng(lng);
                  }}
                  onClearFilters={handleClearFilters}
                  hasActiveFilters={hasActiveFilters}
                />
              </div>
            )}

            {/* Products Grid */}
            <div className="flex-1">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-xl text-muted-foreground">
                    {products.length === 0 
                      ? "No products found in this category" 
                      : "No products match your filters"}
                  </p>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      className="mt-4"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-muted-foreground">
                    Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((item: any) => {
                      const product = item.products;

              return (
                <AmazonProductCard
                  key={item.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  image={extractFirstImage(product.images)}
                  price={Number(item.price)}
                  mrp={item.mrp ? Number(item.mrp) : undefined}
                  rating={4 + Math.random()}
                  reviewCount={Math.floor(Math.random() * 500) + 50}
                  dealBadge={
                    item.mrp && item.mrp > item.price
                      ? `${Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF`
                      : undefined
                  }
                  inStock={item.stock_qty > 0}
                />
              );
            })}
          </div>

          {products.length === 0 && (
            <div className="text-center py-12 bg-muted rounded-lg">
              <p className="text-muted-foreground">
                No products found in this category.
              </p>
            </div>
          )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <AmazonFooter />
    </div>
  );
};

export default CategoryPage;
