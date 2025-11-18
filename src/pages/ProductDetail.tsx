import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Heart, Share2, Package, Star, MapPin, Truck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FeedbackForm from "@/components/FeedbackForm";
import ReviewsList from "@/components/ReviewsList";
import { useProductViewHistory } from "@/hooks/useProductViewHistory";
import { AmazonHeader } from "@/components/amazon/AmazonHeader";
import { AmazonFooter } from "@/components/amazon/AmazonFooter";
import { Separator } from "@/components/ui/separator";

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [wholesalerStock, setWholesalerStock] = useState<any>(null); // Track wholesaler source stock
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Track product view for customers
  useProductViewHistory(product?.id, userRole);

  useEffect(() => {
    fetchProduct();
    checkWishlist();
    calculateDelivery();
    fetchProfile();
    fetchCounts();
  }, [slug]);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
    }
  };

  const fetchCounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { count: cartCount } = await supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      const { count: wishlistCount } = await supabase
        .from("wishlist")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      setCartCount(cartCount || 0);
      setWishlistCount(wishlistCount || 0);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const fetchProduct = async () => {
    const { data: productData } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(name)
      `)
      .eq("slug", slug)
      .single();

    if (!productData) {
      navigate("/dashboard");
      return;
    }

    // Check user role to determine what inventory to show
    const { data: { user } } = await supabase.auth.getUser();
    let roleFromDb = null;
    
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      roleFromDb = profile?.role;
      setUserRole(roleFromDb);
      console.log("👤 User role:", roleFromDb);
    }

    let inventoryData = null;

    // CUSTOMERS and non-logged in users see RETAILER inventory
    if (roleFromDb === 'customer' || !roleFromDb) {
      console.log("🛒 Fetching RETAILER inventory for customer view");
      
      const { data } = await supabase
        .from("inventory")
        .select(`
          *,
          store:stores!inner(id, name, phone, type, owner_id)
        `)
        .eq("product_id", productData.id)
        .eq("stores.type", "retailer")
        .eq("is_active", true)
        .gt("stock_qty", 0);
      
      inventoryData = data;
    } 
    // RETAILERS see WHOLESALER inventory
    else if (userRole === 'retailer') {
      console.log("🏪 Fetching WHOLESALER inventory for retailer view");
      
      const { data } = await supabase
        .from("inventory")
        .select(`
          *,
          store:stores!inner(id, name, phone, type, owner_id)
        `)
        .eq("product_id", productData.id)
        .eq("stores.type", "wholesaler")
        .eq("is_active", true)
        .gt("stock_qty", 0);
      
      inventoryData = data;
    }
    // WHOLESALERS and ADMINS see ALL inventory (or retailer inventory)
    else {
      console.log("👥 Fetching inventory for", userRole);
      
      const { data } = await supabase
        .from("inventory")
        .select(`
          *,
          store:stores!inner(id, name, phone, type, owner_id)
        `)
        .eq("product_id", productData.id)
        .eq("is_active", true)
        .gt("stock_qty", 0);
      
      inventoryData = data;
    }

    setProduct(productData);
    setInventory(inventoryData || []);
    
    if (inventoryData && inventoryData.length > 0) {
      setSelectedInventory(inventoryData[0]);
      
      // ONLY fetch wholesaler stock for PROXY SYSTEM (customers only, NOT retailers)
      if ((userRole === 'customer' || !userRole) && roleFromDb !== 'retailer') {
        const retailerStoreId = inventoryData[0].store.id;
        const retailerProductId = inventoryData[0].product_id;
        console.log("🔍 [PROXY SYSTEM] Looking for wholesaler backup for product:", productData.name);
        console.log("📍 Retailer store ID:", retailerStoreId, "| Product ID:", retailerProductId);
        
        // Find wholesaler with same product name (simple search, no purchase history needed)
        const { data: wholesalerInv, error: wholesalerError } = await supabase
          .from("inventory")
          .select(`
            *,
            product:products(id, name),
            store:stores(id, name, phone, type)
          `)
          .gt("stock_qty", 0);
        
        if (wholesalerError) {
          console.error("❌ Error fetching inventory:", wholesalerError);
        } else {
          console.log("📦 Total inventory items found:", wholesalerInv?.length);
          
          // Filter for wholesalers only
          const wholesalers = wholesalerInv?.filter(inv => inv.store?.type === "wholesaler");
          console.log("🏭 Total wholesaler inventory:", wholesalers?.length);
          
          // Find wholesaler with matching product name (case-insensitive)
          const matchingWholesaler = wholesalers?.find(inv => 
            inv.product?.name?.toLowerCase().trim() === productData.name.toLowerCase().trim()
          );
          
          if (matchingWholesaler) {
            setWholesalerStock(matchingWholesaler);
            console.log("✅ Found wholesaler stock:", {
              store: matchingWholesaler.store.name,
              product: matchingWholesaler.product.name,
              stock: matchingWholesaler.stock_qty,
              price: matchingWholesaler.price
            });
          } else {
            console.log("⚠️ No wholesaler stock found for product:", productData.name);
            if (wholesalers && wholesalers.length > 0) {
              console.log("🔍 Available wholesaler products:", wholesalers.map(w => w.product?.name));
            } else {
              console.log("⚠️ No wholesaler inventory exists in database");
            }
          }
        }
      } else {
        console.log("👤 User is", userRole, "- no proxy system");
        setWholesalerStock(null);
      }
    }
    
    setLoading(false);
  };

  const addToCart = async () => {
    if (!selectedInventory) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Get or create cart
    let { data: cart } = await supabase
      .from("cart")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!cart) {
      const { data: newCart } = await supabase
        .from("cart")
        .insert({ user_id: user.id })
        .select()
        .single();
      cart = newCart;
    }

    if (!cart) return;

    // Check if item already in cart
    const { data: existing } = await supabase
      .from("cart_items")
      .select("*")
      .eq("cart_id", cart.id)
      .eq("inventory_id", selectedInventory.id)
      .single();

    if (existing) {
      await supabase
        .from("cart_items")
        .update({ qty: existing.qty + quantity })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("cart_items")
        .insert({
          cart_id: cart.id,
          inventory_id: selectedInventory.id,
          qty: quantity,
        });
    }

    toast({
      title: "Added to cart",
      description: `${quantity} item(s) added to your cart.`,
    });
  };

  const buyNow = async () => {
    await addToCart();
    navigate("/cart");
  };

  const checkWishlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !product) return;

    const { data } = await supabase
      .from("wishlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .single();

    setInWishlist(!!data);
  };

  const toggleWishlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    if (inWishlist) {
      await supabase
        .from("wishlist")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", product.id);
      
      setInWishlist(false);
      toast({
        title: "Removed from wishlist",
        description: "Product removed from your wishlist.",
      });
    } else {
      await supabase
        .from("wishlist")
        .insert({
          user_id: user.id,
          product_id: product.id,
        });
      
      setInWishlist(true);
      toast({
        title: "Added to wishlist",
        description: "Product added to your wishlist.",
      });
    }
  };

  const calculateDelivery = () => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + Math.floor(Math.random() * 3) + 3); // 3-5 days
    
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    setEstimatedDelivery(deliveryDate.toLocaleDateString('en-US', options));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!product) return null;

  // Convert HTTP to HTTPS for external image URLs
  const images = Array.isArray(product.images) 
    ? product.images.map(img => img.replace(/^http:/, 'https:'))
    : [];
  const attributes = typeof product.attributes === 'object' && product.attributes !== null ? product.attributes : {};

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AmazonHeader
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        userName={profile?.full_name}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Images Section */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">
              <div className="aspect-square overflow-hidden rounded-xl border-2 border-border bg-muted/30 p-4">
                <img
                  src={images[selectedImage] || "/placeholder.svg"}
                  alt={product.name}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-6 gap-2">
                  {images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`aspect-square overflow-hidden rounded-lg border-2 transition-all hover:border-primary ${
                        selectedImage === idx ? "border-primary ring-2 ring-primary/20" : "border-border"
                      }`}
                    >
                      <img 
                        src={img} 
                        alt="" 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:col-span-7 space-y-4">
            {/* Product Title & Brand */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {product.name}
              </h1>
              {product.brand && (
                <p className="text-sm text-muted-foreground">
                  Brand: <span className="text-primary font-medium">{product.brand}</span>
                </p>
              )}
              {product.category && (
                <Badge variant="secondary" className="mt-2">
                  {product.category.name}
                </Badge>
              )}
            </div>

            <Separator />

            {/* Price Section */}
            {selectedInventory && (
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        ₹{selectedInventory.price.toLocaleString()}
                      </span>
                      {selectedInventory.mrp && selectedInventory.mrp > selectedInventory.price && (
                        <>
                          <span className="text-xl text-muted-foreground line-through">
                            ₹{selectedInventory.mrp.toLocaleString()}
                          </span>
                          <Badge variant="destructive" className="text-sm">
                            {Math.round(((selectedInventory.mrp - selectedInventory.price) / selectedInventory.mrp) * 100)}% OFF
                          </Badge>
                        </>
                      )}
                    </div>

                    {/* Stock & Delivery Info */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge 
                        variant={selectedInventory.stock_qty > 10 ? "default" : "secondary"}
                        className="text-sm"
                      >
                        {selectedInventory.stock_qty > 10 ? "In Stock" : `Only ${selectedInventory.stock_qty} left`}
                      </Badge>
                      
                      {estimatedDelivery && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Truck className="h-4 w-4 text-primary" />
                          <span>Get it by <strong className="text-foreground">{estimatedDelivery}</strong></span>
                        </div>
                      )}
                    </div>

                    {wholesalerStock && wholesalerStock.stock_qty > 0 && (
                      <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 p-3 rounded-lg">
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                          ✨ <strong>More available:</strong> Up to <strong>{(selectedInventory?.stock_qty || 0) + (wholesalerStock?.stock_qty || 0)} units</strong> can be ordered
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Multiple Sellers Section - Only show if more than 1 seller */}
            {inventory.length > 1 && (
              <Card className="border-2">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-3 text-muted-foreground">
                    {inventory.length} sellers • Select one
                  </h3>
                  <div className="space-y-2">
                    {inventory.map((inv) => {
                      const discount = inv.mrp && inv.mrp > inv.price 
                        ? Math.round(((inv.mrp - inv.price) / inv.mrp) * 100)
                        : 0;
                      
                      return (
                        <button
                          key={inv.id}
                          onClick={() => setSelectedInventory(inv)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedInventory?.id === inv.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{inv.store.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {inv.stock_qty} in stock
                                </Badge>
                                {discount > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {discount}% off
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-3">
                              <p className="text-lg font-bold text-primary">₹{inv.price.toLocaleString()}</p>
                              {inv.mrp && inv.mrp > inv.price && (
                                <p className="text-xs text-muted-foreground line-through">₹{inv.mrp.toLocaleString()}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quantity & Actions */}
            <Card className="border-2">
              <CardContent className="p-6 space-y-4">
                {/* Quantity Selector */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Quantity</label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border-2 rounded-lg overflow-hidden">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="h-10 px-4 rounded-none"
                      >
                        -
                      </Button>
                      <input
                        type="number"
                        min="1"
                        max={wholesalerStock ? (selectedInventory?.stock_qty || 0) + (wholesalerStock?.stock_qty || 0) : selectedInventory?.stock_qty}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          const maxStock = selectedInventory?.stock_qty || 1;
                          const wholesalerAvailable = wholesalerStock?.stock_qty || 0;
                          const totalAvailable = maxStock + wholesalerAvailable;
                          setQuantity(Math.max(1, Math.min(totalAvailable, val)));
                        }}
                        className="w-16 h-10 text-center border-0 focus:outline-none focus:ring-0 bg-transparent font-semibold text-lg"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const maxStock = selectedInventory?.stock_qty || 1;
                          const wholesalerAvailable = wholesalerStock?.stock_qty || 0;
                          const totalAvailable = maxStock + wholesalerAvailable;
                          setQuantity(Math.min(totalAvailable, quantity + 1));
                        }}
                        disabled={quantity >= ((selectedInventory?.stock_qty || 0) + (wholesalerStock?.stock_qty || 0))}
                        className="h-10 px-4 rounded-none"
                      >
                        +
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ({((selectedInventory?.stock_qty || 0) + (wholesalerStock?.stock_qty || 0))} available)
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold"
                    onClick={buyNow}
                    disabled={!selectedInventory}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Buy Now
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 border-2 hover:bg-primary/5"
                    onClick={addToCart}
                    disabled={!selectedInventory}
                  >
                    <Package className="mr-2 h-5 w-5" />
                    Add to Cart
                  </Button>
                  <Button
                    size="lg"
                    variant={inWishlist ? "default" : "outline"}
                    className="border-2"
                    onClick={toggleWishlist}
                  >
                    <Heart className={`h-5 w-5 ${inWishlist ? "fill-current" : ""}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Product Details Tabs */}
            <Card className="border-2">
              <CardContent className="p-6">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="details">Specifications</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="description" className="mt-6">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-foreground whitespace-pre-line leading-relaxed">
                        {product.description || "No description available."}
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="details" className="mt-6">
                    {Object.keys(attributes).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(attributes).map(([key, value]) => (
                          <div key={key} className="flex justify-between py-3 border-b last:border-0">
                            <dt className="font-medium text-muted-foreground capitalize">
                              {key.replace(/_/g, " ")}
                            </dt>
                            <dd className="text-foreground font-medium">{String(value)}</dd>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No specifications available.
                      </p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="reviews" className="mt-6 space-y-6">
                    {product.overall_rating && (
                      <div className="flex items-center gap-6 pb-6 border-b">
                        <div className="text-center">
                          <div className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            {product.overall_rating}
                          </div>
                          <div className="flex items-center justify-center gap-1 mt-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${
                                  i < Math.round(product.overall_rating)
                                    ? "fill-primary text-primary"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                          <div className="text-sm text-muted-foreground mt-2">
                            {product.rating_count || 0} ratings
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <ReviewsList productId={product.id} />
                    
                    <div className="pt-6 border-t">
                      <h3 className="font-semibold mb-4">Write a Review</h3>
                      <FeedbackForm productId={product.id} />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <AmazonFooter />
    </div>
  );
};

export default ProductDetail;
