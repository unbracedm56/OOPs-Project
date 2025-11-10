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

    const { data: inventoryData } = await supabase
      .from("inventory")
      .select(`
        *,
        store:stores(id, name, phone)
      `)
      .eq("product_id", productData.id)
      .eq("is_active", true)
      .gt("stock_qty", 0);

    setProduct(productData);
    setInventory(inventoryData || []);
    if (inventoryData && inventoryData.length > 0) {
      setSelectedInventory(inventoryData[0]);
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

            <div className="flex gap-2">
              <div className="flex items-center border rounded">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.min(selectedInventory?.stock_qty || 1, quantity + 1))}
                  disabled={quantity >= (selectedInventory?.stock_qty || 1)}
                >
                  +
                </Button>
              </div>
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
