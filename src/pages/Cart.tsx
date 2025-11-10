import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Trash2, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    fetchCart();
  }, []);

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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-6xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="mb-6 text-3xl font-bold">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button onClick={() => navigate("/dashboard")}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const product = item.inventory.products;
                const images = Array.isArray(product.images) ? product.images : [];
                const imageUrl = images[0] || "/placeholder.svg";

                return (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{product.name}</h3>
                          {product.brand && (
                            <p className="text-sm text-muted-foreground mb-2">
                              by {product.brand}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg font-bold">
                              ₹{item.inventory.price}
                            </span>
                            {item.inventory.mrp && item.inventory.mrp > item.inventory.price && (
                              <span className="text-sm text-muted-foreground line-through">
                                ₹{item.inventory.mrp}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border rounded">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.qty - 1)}
                                disabled={item.qty <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="px-3 py-1 min-w-[2rem] text-center">
                                {item.qty}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.qty + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            ₹{(item.inventory.price * item.qty).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-bold">Order Summary</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="font-semibold">₹{deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => navigate("/checkout")}
                  >
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
