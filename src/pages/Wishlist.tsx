import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Wishlist = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-6xl">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="mb-6 text-3xl font-bold">My Wishlist</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : wishlist.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Your wishlist is empty</p>
              <Button className="mt-4" onClick={() => navigate("/dashboard")}>
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlist.map((item) => {
              const product = item.product;
              const images = Array.isArray(product.images) ? product.images : [];
              const imageUrl = images[0] || "/placeholder.svg";
              
              return (
                <Card key={item.id} className="group relative overflow-hidden hover:shadow-lg transition-shadow">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100 bg-background/80 backdrop-blur-sm"
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
                    <div className="aspect-square overflow-hidden bg-muted">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base line-clamp-2">
                        {product.name}
                      </CardTitle>
                      {product.brand && (
                        <p className="text-sm text-muted-foreground">{product.brand}</p>
                      )}
                      {product.category && (
                        <Badge variant="secondary" className="mt-1 w-fit">
                          {product.category.name}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      {item.inventory && (
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
                      )}
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
