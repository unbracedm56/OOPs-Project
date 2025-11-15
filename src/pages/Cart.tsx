import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Lock, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AmazonHeader } from "@/components/amazon/AmazonHeader";
import { AmazonFooter } from "@/components/amazon/AmazonFooter";
import { Badge } from "@/components/ui/badge";

interface CartItem {
  id: string;
  qty: number;
  inventory_id: string;
  inventory: {
    id: string;
    price: number;
    mrp: number;
    product_id: string;
    store_id: string;
    products: {
      id: string;
      name: string;
      slug: string;
      images: any;
      brand: string;
    };
  };
}

const Cart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    fetchCart();
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profile) setUserName(profile.full_name);

      const { data: wishlist } = await supabase
        .from("wishlist")
        .select("id", { count: "exact" })
        .eq("user_id", user.id);

      setWishlistCount(wishlist?.length || 0);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const fetchCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: cart } = await supabase
        .from("cart")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!cart) {
        setLoading(false);
        return;
      }

      const { data: items, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          inventory:inventory_id (
            id,
            price,
            mrp,
            product_id,
            store_id,
            products (
              id,
              name,
              slug,
              images,
              brand
            )
          )
        `)
        .eq("cart_id", cart.id);

      if (error) throw error;
      setCartItems(items || []);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;

    try {
      await supabase
        .from("cart_items")
        .update({ qty: newQty })
        .eq("id", itemId);

      setCartItems(items =>
        items.map(item =>
          item.id === itemId ? { ...item, qty: newQty } : item
        )
      );

      toast({
        title: "Updated",
        description: "Cart updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cart",
        variant: "destructive",
      });
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      setCartItems(items => items.filter(item => item.id !== itemId));

      toast({
        title: "Removed",
        description: "Item removed from cart",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.inventory.price * item.qty,
    0
  );
  const deliveryFee = cartItems.length > 0 ? 5 : 0;
  const total = subtotal + deliveryFee;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AmazonHeader 
          cartCount={0}
          wishlistCount={wishlistCount}
          userName={userName}
          onSignOut={handleSignOut}
        />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
        <AmazonFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AmazonHeader 
        cartCount={cartItems.length}
        wishlistCount={wishlistCount}
        userName={userName}
        onSignOut={handleSignOut}
      />

      <div className="container mx-auto px-4 py-8">
        {cartItems.length === 0 ? (
          <Card className="max-w-2xl mx-auto text-center p-12">
            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
                <p className="text-muted-foreground mb-6">
                  Add items to get started
                </p>
              </div>
              <Button 
                size="lg" 
                onClick={() => navigate("/dashboard")}
                className="gap-2"
              >
                Continue Shopping
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
              <p className="text-muted-foreground">
                {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your cart
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              {/* Cart Items */}
              <div className="lg:col-span-8 space-y-4">
                {cartItems.map((item) => {
                  const product = item.inventory.products;
                  const images = Array.isArray(product.images) ? product.images : [];
                  const imageUrl = images[0] || "/placeholder.svg";
                  const discount = item.inventory.mrp && item.inventory.mrp > item.inventory.price
                    ? Math.round(((item.inventory.mrp - item.inventory.price) / item.inventory.mrp) * 100)
                    : 0;

                  return (
                    <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex gap-6">
                          {/* Product Image */}
                          <div 
                            className="w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg bg-white border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => navigate(`/product/${product.slug}`)}
                          >
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="h-full w-full object-contain p-2"
                            />
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between gap-4 mb-2">
                              <div className="flex-1">
                                <h3 
                                  className="font-semibold text-lg mb-1 hover:text-primary cursor-pointer line-clamp-2"
                                  onClick={() => navigate(`/product/${product.slug}`)}
                                >
                                  {product.name}
                                </h3>
                                {product.brand && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Brand: <span className="font-medium">{product.brand}</span>
                                  </p>
                                )}
                                <div className="flex items-baseline gap-2 mb-3">
                                  <span className="text-2xl font-bold text-foreground">
                                    ₹{item.inventory.price.toLocaleString()}
                                  </span>
                                  {item.inventory.mrp && item.inventory.mrp > item.inventory.price && (
                                    <>
                                      <span className="text-sm text-muted-foreground line-through">
                                        ₹{item.inventory.mrp.toLocaleString()}
                                      </span>
                                      <Badge variant="destructive" className="text-xs">
                                        {discount}% OFF
                                      </Badge>
                                    </>
                                  )}
                                </div>
                                <p className="text-sm text-green-600 font-medium mb-4">
                                  In Stock
                                </p>
                              </div>

                              {/* Item Total (Desktop) */}
                              <div className="hidden md:block text-right">
                                <p className="text-sm text-muted-foreground mb-1">Item Total</p>
                                <p className="text-xl font-bold">
                                  ₹{(item.inventory.price * item.qty).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {/* Quantity and Remove */}
                            <div className="flex items-center gap-4">
                              <div className="flex items-center border rounded-lg overflow-hidden">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item.id, item.qty - 1)}
                                  disabled={item.qty <= 1}
                                  className="h-9 px-3 hover:bg-muted rounded-none"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="px-4 py-2 min-w-[3rem] text-center font-medium border-x">
                                  {item.qty}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item.id, item.qty + 1)}
                                  className="h-9 px-3 hover:bg-muted rounded-none"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </Button>
                            </div>

                            {/* Item Total (Mobile) */}
                            <div className="md:hidden mt-3 pt-3 border-t">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Item Total:</span>
                                <span className="text-lg font-bold">
                                  ₹{(item.inventory.price * item.qty).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Order Summary - Sticky */}
              <div className="lg:col-span-4">
                <div className="sticky top-24">
                  <Card className="overflow-hidden border-2">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Secure Checkout</span>
                      </div>
                      
                      <h2 className="text-xl font-bold">Order Summary</h2>
                      
                      <div className="space-y-3 py-4 border-y">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                          <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Delivery Fee</span>
                          <span className="font-semibold text-green-600">
                            {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-baseline pt-2">
                        <span className="text-lg font-semibold">Order Total</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-primary">
                            ₹{total.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <Button
                        className="w-full h-12 text-base font-semibold gap-2"
                        size="lg"
                        onClick={() => navigate("/checkout")}
                      >
                        <Lock className="h-4 w-4" />
                        Proceed to Checkout
                      </Button>

                      <div className="pt-4 space-y-2 text-xs text-muted-foreground border-t">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Safe and secure payments</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-3 w-3" />
                          <span>100% Payment Protection</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Continue Shopping Card */}
                  <Card className="mt-4">
                    <CardContent className="p-4 text-center">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate("/dashboard")}
                      >
                        Continue Shopping
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <AmazonFooter />
    </div>
  );
};

export default Cart;
