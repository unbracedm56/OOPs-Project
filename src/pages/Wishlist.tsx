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

  useEffect(() => {
    fetchWishlist();
    fetchProfile();
    fetchCounts();
  }, []);

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

  const handleAddToCart = async (productId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if already in cart
      const { data: existingCart } = await supabase
        .from("cart")
        .select("id, qty")
        .eq("user_id", user.id)
        .eq("inventory_id", productId)
        .single();

      if (existingCart) {
        await supabase
          .from("cart")
          .update({ qty: existingCart.qty + 1 })
          .eq("id", existingCart.id);
      } else {
        await supabase
          .from("cart")
          .insert({ user_id: user.id, inventory_id: productId, qty: 1 });
      }

      toast({
        title: "Added to cart",
      });
      
      setCartCount(prev => prev + 1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              My Wishlist
            </h1>
            <p className="text-muted-foreground">Save your favorite products for later</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your wishlist...</p>
              </div>
            </div>
          ) : wishlist.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="py-16 text-center">
                <div className="mx-auto w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Heart className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
                <p className="text-muted-foreground mb-6">Start adding products you love!</p>
                <Button 
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover"
                  onClick={() => navigate("/customer-dashboard")}
                >
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-muted-foreground">{wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {wishlist.map((item) => {
                  const product = item.product;
                  const images = Array.isArray(product.images) ? product.images : [];
                  const imageUrl = images[0] || "/placeholder.svg";
                  
                  return (
                    <Card key={item.id} className="group relative overflow-hidden border-2 hover:border-primary/50 hover:shadow-xl transition-all">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 z-10 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(item.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div
                        className="cursor-pointer"
                        onClick={() => navigate(`/product/${product.slug}`)}
                      >
                        <div className="aspect-square overflow-hidden bg-muted relative">
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2">
                            <Heart className="h-5 w-5 text-primary fill-primary" />
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-base line-clamp-2 mb-1">
                            {product.name}
                          </h3>
                          {product.brand && (
                            <p className="text-sm text-muted-foreground mb-2">{product.brand}</p>
                          )}
                          {product.category && (
                            <Badge variant="secondary" className="mb-3 text-xs">
                              {product.category.name}
                            </Badge>
                          )}
                          {item.inventory && (
                            <div className="space-y-2">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold">₹{item.inventory.price}</span>
                                {item.inventory.mrp && item.inventory.mrp > item.inventory.price && (
                                  <>
                                    <span className="text-sm text-muted-foreground line-through">
                                      ₹{item.inventory.mrp}
                                    </span>
                                    <Badge variant="destructive" className="text-xs">
                                      {Math.round(((item.inventory.mrp - item.inventory.price) / item.inventory.mrp) * 100)}% OFF
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-4 pt-0">
                        <Button 
                          className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.inventory) {
                              handleAddToCart(item.inventory.id);
                            }
                          }}
                          disabled={!item.inventory}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Add to Cart
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      <AmazonFooter />
    </div>
  );
};

export default Wishlist;
