import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Heart, Share2, Store, ArrowLeft, Package, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FeedbackForm from "@/components/FeedbackForm";
import ReviewsList from "@/components/ReviewsList";

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

  useEffect(() => {
    fetchProduct();
    checkWishlist();
    calculateDelivery();
  }, [slug]);

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
    let userRole = null;
    
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      userRole = profile?.role;
      console.log("👤 User role:", userRole);
    }

    let inventoryData = null;

    // CUSTOMERS and non-logged in users see RETAILER inventory
    if (userRole === 'customer' || !userRole) {
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
      
      // ONLY fetch wholesaler stock for PROXY SYSTEM (customers only)
      if (userRole === 'customer' || !userRole) {
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Product Details</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Images Section */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
              <img
                src={images[selectedImage] || "/placeholder.svg"}
                alt={product.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square overflow-hidden rounded border-2 ${
                      selectedImage === idx ? "border-primary" : "border-transparent"
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

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              {product.brand && (
                <p className="text-muted-foreground">by {product.brand}</p>
              )}
              {product.category && (
                <Badge variant="secondary" className="mt-2">
                  {product.category.name}
                </Badge>
              )}
            </div>

            {selectedInventory && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-3xl font-bold">₹{selectedInventory.price}</span>
                    {selectedInventory.mrp && selectedInventory.mrp > selectedInventory.price && (
                      <>
                        <span className="text-xl text-muted-foreground line-through">
                          ₹{selectedInventory.mrp}
                        </span>
                        <Badge variant="destructive">
                          {Math.round(((selectedInventory.mrp - selectedInventory.price) / selectedInventory.mrp) * 100)}% OFF
                        </Badge>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Store className="h-4 w-4" />
                    <span>Sold by {selectedInventory.store.name}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant={selectedInventory.stock_qty > 10 ? "default" : "secondary"}>
                      {selectedInventory.stock_qty > 10 ? "In Stock" : `Only ${selectedInventory.stock_qty} left`}
                    </Badge>
                    {wholesalerStock && wholesalerStock.stock_qty > 0 && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        +{wholesalerStock.stock_qty} available via wholesaler
                      </Badge>
                    )}
                  </div>

                  {estimatedDelivery && (
                    <div className="flex items-center gap-2 text-sm mb-4 p-3 bg-muted rounded-lg">
                      <Package className="h-4 w-4 text-primary" />
                      <span>Estimated delivery by <strong>{estimatedDelivery}</strong></span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {inventory.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Available Sellers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {inventory.map((inv) => (
                    <button
                      key={inv.id}
                      onClick={() => setSelectedInventory(inv)}
                      className={`w-full text-left p-3 rounded border-2 transition-colors ${
                        selectedInventory?.id === inv.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{inv.store.name}</p>
                          <p className="text-sm text-muted-foreground">Stock: {inv.stock_qty}</p>
                        </div>
                        <p className="font-bold">₹{inv.price}</p>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <div className="flex items-center border rounded-md bg-white dark:bg-gray-900">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-10 px-3"
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
                    className="w-20 h-10 px-3 py-2 text-center border-0 focus:outline-none focus:ring-0 bg-transparent font-medium"
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
                    className="h-10 px-3"
                  >
                    +
                  </Button>
                </div>
                {wholesalerStock && quantity > (selectedInventory?.stock_qty || 0) && (
                  <p className="text-sm text-orange-600 flex items-center gap-1 font-medium">
                    <Package className="h-4 w-4" />
                    {quantity - (selectedInventory?.stock_qty || 0)} units will be sourced from wholesaler
                  </p>
                )}
              </div>
              
              {wholesalerStock && (
                <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 p-3 rounded-md">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    💡 <strong>Good news!</strong> You can order up to <strong>{(selectedInventory?.stock_qty || 0) + (wholesalerStock?.stock_qty || 0)} units</strong>
                    <br />
                    <span className="text-xs">Retailer has {selectedInventory?.stock_qty}, additional stock available from wholesaler</span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 bg-gradient-to-r from-primary to-primary-glow"
                onClick={buyNow}
                disabled={!selectedInventory}
              >
                Buy Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={addToCart}
                disabled={!selectedInventory}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant={inWishlist ? "default" : "outline"}
                onClick={toggleWishlist}
              >
                <Heart className={`h-5 w-5 ${inWishlist ? "fill-current" : ""}`} />
              </Button>
            </div>

            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="description" className="flex-1">Description</TabsTrigger>
                <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1">Reviews</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="mt-4">
                <p className="text-muted-foreground whitespace-pre-line">
                  {product.description || "No description available."}
                </p>
              </TabsContent>
              <TabsContent value="details" className="mt-4">
                {Object.keys(attributes).length > 0 ? (
                  <dl className="space-y-2">
                    {Object.entries(attributes).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b">
                        <dt className="font-medium capitalize">{key.replace(/_/g, " ")}</dt>
                        <dd className="text-muted-foreground">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-muted-foreground">No additional details available.</p>
                )}
              </TabsContent>
              <TabsContent value="reviews" className="mt-4 space-y-6">
                {product.overall_rating && (
                  <div className="flex items-center gap-4 pb-4 border-b">
                    <div className="text-center">
                      <div className="text-4xl font-bold">{product.overall_rating}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round(product.overall_rating)
                                ? "fill-primary text-primary"
                                : "text-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {product.rating_count || 0} ratings
                      </div>
                    </div>
                  </div>
                )}
                
                <ReviewsList productId={product.id} />
                
                <div className="pt-4 border-t">
                  <FeedbackForm productId={product.id} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
