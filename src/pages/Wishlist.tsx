import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Heart, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AmazonHeader } from "@/components/amazon/AmazonHeader";
import { AmazonFooter } from "@/components/amazon/AmazonFooter";

const Wishlist = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    checkRoleAndFetchData();
  }, []);

  const checkRoleAndFetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check user role
      const { data: role } = await supabase.rpc('get_user_role', {
        _user_id: user.id
      });

      setUserRole(role || "customer");
      setUser(user);
      fetchWishlist();
      fetchProfile();
      fetchCounts();
    } catch (error) {
      console.error("Error checking role:", error);
      navigate("/auth");
    }
  };

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(data);
  };

  const fetchCounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count: wCount } = await supabase
      .from("wishlist")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { count: cCount } = await supabase
      .from("cart")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    setWishlistCount(wCount || 0);
    setCartCount(cCount || 0);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  useEffect(() => {
    if (user) {
      // Subscribe to wishlist changes
      const channel = supabase
        .channel('wishlist-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wishlist',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchWishlist();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);

      const { data: wishlistData, error } = await supabase
        .from("wishlist")
        .select(`
          id,
          product_id,
          product:products (
            id,
            name,
            slug,
            images,
            brand,
            category:categories (
              name
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get inventory for each product to show pricing
      const productsWithInventory = await Promise.all(
        (wishlistData || []).map(async (item) => {
          const { data: inventory } = await supabase
            .from("inventory")
            .select("price, mrp")
            .eq("product_id", item.product_id)
            .eq("is_active", true)
            .gt("stock_qty", 0)
            .order("price", { ascending: true })
            .limit(1)
            .single();

          return {
            ...item,
            inventory
          };
        })
      );

      setWishlist(productsWithInventory);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      toast({
        title: "Removed from wishlist",
      });
      
      setWishlist(wishlist.filter((item) => item.id !== itemId));
      setWishlistCount(prev => prev - 1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddToCart = async (productId: string, inventoryId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get or create cart
      let { data: cart } = await supabase
        .from("cart")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!cart) {
        const { data: newCart, error: cartError } = await supabase
          .from("cart")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (cartError || !newCart) {
          toast({
            title: "Error",
            description: "Failed to create cart",
            variant: "destructive",
          });
          return;
        }
        cart = newCart;
      }

      // Check if item already in cart
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("*")
        .eq("cart_id", cart.id)
        .eq("inventory_id", inventoryId)
        .single();

      if (existingItem) {
        await supabase
          .from("cart_items")
          .update({ qty: existingItem.qty + 1 })
          .eq("id", existingItem.id);
      } else {
        await supabase
          .from("cart_items")
          .insert({
            cart_id: cart.id,
            inventory_id: inventoryId,
            qty: 1,
          });
      }

      toast({
        title: "Added to cart",
        description: "Item has been added to your cart",
      });
      
      fetchCounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <AmazonHeader
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        userName={profile?.full_name?.split(" ")[0]}
        onSignOut={handleSignOut}
        userRole={userRole || "customer"}
      />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              My Wishlist
            </h1>
            <p className="text-muted-foreground">
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your wishlist...</p>
              </div>
            </div>
          ) : wishlist.length === 0 ? (
            <Card className="max-w-2xl mx-auto text-center p-12">
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  <Heart className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
                  <p className="text-muted-foreground mb-6">
                    Save items you love to buy them later
                  </p>
                </div>
                <Button 
                  size="lg"
                  onClick={() => navigate(userRole === "retailer" ? "/retailer/wholesaler-marketplace" : "/dashboard")}
                >
                  Continue Shopping
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {wishlist.map((item) => {
                const product = item.product;
                const images = Array.isArray(product.images) ? product.images : [];
                const imageUrl = images[0] || "/placeholder.svg";
                const discount = item.inventory?.mrp && item.inventory?.mrp > item.inventory?.price
                  ? Math.round(((item.inventory.mrp - item.inventory.price) / item.inventory.mrp) * 100)
                  : 0;
                
                return (
                  <Card 
                    key={item.id} 
                    className="group relative overflow-hidden border hover:border-primary/50 hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => navigate(`/product/${product.slug}`)}
                  >
                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>

                    {/* Wishlist Icon */}
                    <div className="absolute top-2 left-2 z-10">
                      <div className="h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center">
                        <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                      </div>
                    </div>

                    {/* Product Image */}
                    <div className="aspect-square bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center p-4 relative overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    </div>

                    <CardContent className="p-4 space-y-2">
                      {/* Brand Badge */}
                      {product.brand && (
                        <Badge variant="outline" className="text-xs mb-1 border-primary/30 text-primary">
                          {product.brand}
                        </Badge>
                      )}

                      {/* Product Name */}
                      <h3 className="text-sm font-medium line-clamp-2 text-foreground group-hover:text-primary transition-colors min-h-[2.5rem]">
                        {product.name}
                      </h3>

                      {/* Category */}
                      {product.category && (
                        <p className="text-xs text-muted-foreground">
                          {product.category.name}
                        </p>
                      )}

                      {/* Price Section */}
                      {item.inventory && (
                        <div className="pt-2 space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-foreground">
                              ₹{item.inventory.price.toLocaleString()}
                            </span>
                            {item.inventory.mrp && item.inventory.mrp > item.inventory.price && (
                              <span className="text-sm text-muted-foreground line-through">
                                ₹{item.inventory.mrp.toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* Discount Badge */}
                          {discount > 0 && (
                            <Badge variant="secondary" className="bg-success/10 text-success border-0">
                              Save {discount}%
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Add to Cart Button */}
                      <Button 
                        className="w-full mt-3 gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.inventory) {
                            handleAddToCart(item.product_id, item.inventory.id);
                          }
                        }}
                        disabled={!item.inventory}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Add to Cart
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <AmazonFooter />
    </div>
  );
};

export default Wishlist;
