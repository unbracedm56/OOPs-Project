import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import {
  AmazonHeader,
  AmazonFooter,
  AmazonHeroBanner,
  AmazonProductCard,
  AmazonCarousel,
  AmazonCarouselItem,
  AmazonQuickViewModal,
} from "@/components/amazon";
import { SignOutDialog } from "@/components/SignOutDialog";

const CustomerDashboardNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [viewedProducts, setViewedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);

  // Hero Banners - Amazon-style
  const heroBanners = [
    {
      id: "1",
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&h=600&fit=crop",
      title: "Welcome to Blitz Bazaar",
      description: "Discover amazing products from local retailers near you",
      ctaText: "Shop Now",
      ctaLink: "#products",
    },
    {
      id: "2",
      image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1920&h=600&fit=crop",
      title: "Great Deals Every Day",
      description: "Save big on your favorite products",
      ctaText: "View Deals",
      ctaLink: "/category/deals",
    },
    {
      id: "3",
      image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=1920&h=600&fit=crop",
      title: "Fresh Arrivals",
      description: "Check out our newest products",
      ctaText: "Explore",
      ctaLink: "/category/new-arrivals",
    },
  ];

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchViewedProducts();
      fetchWishlistCount();
      fetchCartCount();

      // Subscribe to real-time updates
      const wishlistChannel = supabase
        .channel("wishlist-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "wishlist",
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchWishlistCount()
        )
        .subscribe();

      const cartChannel = supabase
        .channel("cart-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "cart_items",
          },
          () => fetchCartCount()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(wishlistChannel);
        supabase.removeChannel(cartChannel);
      };
    }
  }, [user]);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/auth");
      return;
    }

    setUser(user);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileData?.role !== "customer") {
      navigate("/dashboard");
      return;
    }

    setProfile(profileData);
    setLoading(false);
  };



  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("inventory")
      .select(
        `
        id,
        price,
        mrp,
        stock_qty,
        is_active,
        products:product_id (
          id,
          name,
          slug,
          description,
          images,
          brand,
          categories:category_id (
            id,
            name
          )
        ),
        stores:store_id (
          id,
          name,
          type
        )
      `
      )
      .eq("is_active", true)
      .eq("stores.type", "retailer")
      .gt("stock_qty", 0)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching products:", error);
      return;
    }

    if (data) {
      setProducts(data.filter((item) => item.products !== null));
    }
  };

  const fetchViewedProducts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("product_view_history")
      .select("product_id, viewed_at")
      .eq("user_id", user.id)
      .order("viewed_at", { ascending: false })
      .limit(10);

    if (data && data.length > 0) {
      const productIds = [...new Set(data.map((h) => h.product_id))];

      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, slug, images, categories(name)")
        .in("id", productIds);

      const { data: inventoryData } = await supabase
        .from("inventory")
        .select(
          `
          product_id,
          price,
          mrp,
          stores!inner(type)
        `
        )
        .in("product_id", productIds)
        .eq("stores.type", "retailer")
        .eq("is_active", true)
        .gt("stock_qty", 0);

      if (productsData && inventoryData) {
        const viewed = data
          .map((entry) => {
            const product = productsData.find((p) => p.id === entry.product_id);
            const inventory = inventoryData.find(
              (inv) => inv.product_id === entry.product_id
            );

            if (!product || !inventory) return null;

            const images = Array.isArray(product.images)
              ? product.images.map((img: any) =>
                  typeof img === "string"
                    ? img.replace(/^http:/, "https:")
                    : "/placeholder.svg"
                )
              : ["/placeholder.svg"];

            return {
              ...product,
              images,
              price: Number(inventory.price),
              mrp: inventory.mrp ? Number(inventory.mrp) : undefined,
              viewed_at: entry.viewed_at,
            };
          })
          .filter(Boolean);

        setViewedProducts(viewed);
      }
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowSignOutDialog(false);
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/");
  };

  const sanitizeImageUrl = (url: string | null | undefined) => {
    if (!url) return "/placeholder.svg";
    let cleaned = url.replace(/^\"|\"$/g, "").replace(/^\'|\'$/g, "").trim();
    cleaned = cleaned.replace(/^http:/, "https:");
    return cleaned || "/placeholder.svg";
  };

  const extractFirstImage = (images: any): string => {
    if (!images) return "/placeholder.svg";
    if (Array.isArray(images)) {
      if (images.length === 0) return "/placeholder.svg";
      const first = images[0];
      if (typeof first === "string") return sanitizeImageUrl(first);
      if (first && typeof first === "object") {
        return sanitizeImageUrl(first.url || first.src || first.image);
      }
    }
    if (typeof images === "string") {
      try {
        const parsed = JSON.parse(images);
        return extractFirstImage(parsed);
      } catch {
        return sanitizeImageUrl(images);
      }
    }
    return "/placeholder.svg";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Amazon-style Header */}
      <AmazonHeader
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        userName={profile?.full_name?.split(" ")[0]}
        avatarUrl={profile?.avatar_url}
        onSignOut={() => setShowSignOutDialog(true)}
        userRole="customer"
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Banner */}
        <AmazonHeroBanner banners={heroBanners} autoPlay interval={6000} />

        {/* Main Container */}
        <div className="container mx-auto px-4 py-8 space-y-12">
          {/* Continue Shopping */}
          {viewedProducts.length > 0 && (
            <section>
              <AmazonCarousel title="Continue Shopping" showArrows>
                {viewedProducts.map((product: any) => (
                  <AmazonCarouselItem key={product.id} className="w-[280px]">
                    <AmazonProductCard
                      id={product.id}
                      name={product.name}
                      slug={product.slug}
                      image={extractFirstImage(product.images)}
                      price={product.price}
                      mrp={product.mrp}
                      rating={4.5}
                      reviewCount={Math.floor(Math.random() * 1000) + 100}
                      inStock={true}
                      onQuickView={() => setQuickViewProduct(product)}
                    />
                  </AmazonCarouselItem>
                ))}
              </AmazonCarousel>
            </section>
          )}

          {/* Recommended for You */}
          <section id="products">
            <h2 className="text-2xl font-bold mb-6 text-foreground">
              Recommended for You
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((item: any) => {
                const product = item.products;
                const imageUrl = extractFirstImage(product.images);

                return (
                  <AmazonProductCard
                    key={item.id}
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    image={imageUrl}
                    price={Number(item.price)}
                    mrp={item.mrp ? Number(item.mrp) : undefined}
                    rating={4 + Math.random()}
                    reviewCount={Math.floor(Math.random() * 500) + 50}
                    badge={product.categories?.name}
                    dealBadge={
                      item.mrp && item.mrp > item.price
                        ? `${Math.round(
                            ((item.mrp - item.price) / item.mrp) * 100
                          )}% OFF`
                        : undefined
                    }
                    inStock={item.stock_qty > 0}
                    onQuickView={() =>
                      setQuickViewProduct({
                        ...product,
                        price: Number(item.price),
                        mrp: item.mrp ? Number(item.mrp) : undefined,
                        images: Array.isArray(product.images)
                          ? product.images.map((img: any) =>
                              sanitizeImageUrl(
                                typeof img === "string" ? img : img?.url
                              )
                            )
                          : [imageUrl],
                        inStock: item.stock_qty > 0,
                      })
                    }
                  />
                );
              })}
            </div>

            {products.length === 0 && (
              <div className="text-center py-12 bg-muted rounded-lg">
                <p className="text-muted-foreground">
                  No products available at the moment. Check back soon!
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Amazon-style Footer */}
      <AmazonFooter />

      {/* Quick View Modal */}
      <AmazonQuickViewModal
        open={!!quickViewProduct}
        onOpenChange={(open) => !open && setQuickViewProduct(null)}
        product={quickViewProduct}
        onAddToCart={async (quantity = 1) => {
          if (!quickViewProduct || !user) {
            navigate("/auth");
            return;
          }

          try {
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

            // Get product inventory - use the first available inventory
            const { data: inventory } = await supabase
              .from("inventory")
              .select("*")
              .eq("product_id", quickViewProduct.id)
              .gt("stock_qty", 0)
              .limit(1)
              .single();

            if (!inventory) {
              toast({
                title: "Out of stock",
                description: "This product is currently unavailable.",
                variant: "destructive",
              });
              return;
            }

            // Check if item already in cart
            const { data: existing } = await supabase
              .from("cart_items")
              .select("*")
              .eq("cart_id", cart.id)
              .eq("inventory_id", inventory.id)
              .maybeSingle();

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
                  inventory_id: inventory.id,
                  qty: quantity,
                });
            }

            toast({
              title: "Added to cart",
              description: `${quantity} item(s) added to your cart successfully.`,
            });
            setQuickViewProduct(null);
          } catch (error) {
            console.error("Error adding to cart:", error);
            toast({
              title: "Error",
              description: "Failed to add product to cart.",
              variant: "destructive",
            });
          }
        }}
        onAddToWishlist={async () => {
          if (!quickViewProduct || !user) {
            navigate("/auth");
            return;
          }

          try {
            // Check if already in wishlist
            const { data: existing } = await supabase
              .from("wishlist")
              .select("id")
              .eq("user_id", user.id)
              .eq("product_id", quickViewProduct.id)
              .maybeSingle();

            if (existing) {
              toast({
                title: "Already in wishlist",
                description: "This product is already in your wishlist.",
              });
              return;
            }

            // Add to wishlist
            const { error } = await supabase
              .from("wishlist")
              .insert({
                user_id: user.id,
                product_id: quickViewProduct.id,
              });

            if (error) throw error;

            toast({
              title: "Added to wishlist",
              description: "Product added to your wishlist.",
            });
          } catch (error) {
            console.error("Error adding to wishlist:", error);
            toast({
              title: "Error",
              description: "Failed to add product to wishlist.",
              variant: "destructive",
            });
          }
        }}
        onViewFull={() => {
          if (quickViewProduct) {
            navigate(`/product/${quickViewProduct.slug}`);
          }
        }}
      />

      {/* Sign Out Dialog */}
      <SignOutDialog
        open={showSignOutDialog}
        onOpenChange={setShowSignOutDialog}
        onConfirm={handleSignOut}
      />
    </div>
  );
};

export default CustomerDashboardNew;
