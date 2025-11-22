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

const RetailerWholesalerMarketplace = () => {
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

  // Utility functions for image handling
  const sanitizeImageUrl = (url: string): string => {
    if (!url) return "/placeholder.svg";
    
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    
    if (url.includes("supabase")) {
      return url;
    }
    
    if (url.startsWith("/")) {
      return url;
    }
    
    return `/placeholder.svg`;
  };

  const extractFirstImage = (images: any): string => {
    if (!images) return "/placeholder.svg";
    
    if (typeof images === "string") {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sanitizeImageUrl(typeof parsed[0] === "string" ? parsed[0] : parsed[0]?.url);
        }
      } catch {
        return sanitizeImageUrl(images);
      }
    }
    
    if (Array.isArray(images) && images.length > 0) {
      return sanitizeImageUrl(typeof images[0] === "string" ? images[0] : images[0]?.url);
    }
    
    return "/placeholder.svg";
  };

  // Hero Banners - Amazon-style for wholesaler marketplace
  const heroBanners = [
    {
      id: "1",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=600&fit=crop",
      title: "Welcome to Wholesaler Marketplace",
      description: "Purchase quality products in bulk for your retail store",
      ctaText: "Shop Now",
      ctaLink: "#products",
    },
    {
      id: "2",
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&h=600&fit=crop",
      title: "Best Wholesale Deals",
      description: "Save more when buying in bulk from trusted wholesalers",
      ctaText: "View Deals",
      ctaLink: "#products",
    },
    {
      id: "3",
      image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1920&h=600&fit=crop",
      title: "Stock Your Store",
      description: "Find everything you need for your retail business",
      ctaText: "Explore",
      ctaLink: "#products",
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
        .channel("retailer-wishlist-changes")
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
        .channel("retailer-cart-changes")
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
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (!profileData || profileData.role !== "retailer") {
      navigate("/dashboard");
      return;
    }

    setUser(authUser);
    setProfile(profileData);
    setLoading(false);
  };

  const fetchProducts = async () => {
    if (!user) return;

    // First get all wholesaler store IDs
    const { data: wholesalerStores } = await supabase
      .from("stores")
      .select("id")
      .eq("type", "wholesaler")
      .eq("is_active", true);

    if (!wholesalerStores || wholesalerStores.length === 0) {
      console.log("No active wholesaler stores found");
      setProducts([]);
      return;
    }

    const wholesalerStoreIds = wholesalerStores.map(store => store.id);

    // Now fetch inventory from wholesaler stores
    const { data, error } = await supabase
      .from("inventory")
      .select(`
        id,
        price,
        mrp,
        stock_qty,
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
      `)
      .in("store_id", wholesalerStoreIds)
      .eq("is_active", true)
      .gt("stock_qty", 0)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      console.log("Fetched inventory items:", data.length);
      
      const wholesalerProducts = data.filter(item => 
        item.products !== null && item.stores?.type === "wholesaler"
      );
      
      console.log("Filtered wholesaler products:", wholesalerProducts.length);
      
      const productsWithImages = wholesalerProducts.map((item) => ({
        ...item.products,
        price: Number(item.price),
        mrp: item.mrp ? Number(item.mrp) : undefined,
        stock_qty: item.stock_qty,
        inventory_id: item.id,
        store_name: item.stores.name,
        images: Array.isArray(item.products.images)
          ? item.products.images.map((img: any) => sanitizeImageUrl(typeof img === "string" ? img : img?.url))
          : ["/placeholder.svg"],
      }));

      setProducts(productsWithImages);
    }
  };

  const fetchViewedProducts = async () => {
    if (!user) return;

    // Get viewed product history for this retailer
    const { data } = await supabase
      .from("product_view_history")
      .select("product_id, viewed_at")
      .eq("user_id", user.id)
      .order("viewed_at", { ascending: false })
      .limit(10);

    console.log("📜 Viewed products history:", data?.length || 0, "entries");

    if (data && data.length > 0) {
      const productIds = [...new Set(data.map((h) => h.product_id))];

      // Get product details
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, slug, images, categories(name)")
        .in("id", productIds);

      console.log("📦 Products data found:", productsData?.length || 0);

      // Get WHOLESALER inventory only for these products
      const { data: inventoryData } = await supabase
        .from("inventory")
        .select(`
          product_id,
          id,
          price,
          mrp,
          stock_qty,
          stores!inner(type)
        `)
        .in("product_id", productIds)
        .eq("stores.type", "wholesaler")
        .eq("is_active", true)
        .gt("stock_qty", 0);

      console.log("🏭 Wholesaler inventory found:", inventoryData?.length || 0);

      if (productsData && inventoryData) {
        const viewed = data
          .map((entry) => {
            const product = productsData.find((p) => p.id === entry.product_id);
            const inventory = inventoryData.find(
              (inv) => inv.product_id === entry.product_id
            );

            if (!product || !inventory) return null;

            return {
              ...product,
              images: Array.isArray(product.images)
                ? product.images.map((img: any) =>
                    sanitizeImageUrl(typeof img === "string" ? img : img?.url)
                  )
                : ["/placeholder.svg"],
              price: Number(inventory.price),
              mrp: inventory.mrp ? Number(inventory.mrp) : undefined,
              inventory_id: inventory.id,
              stock_qty: inventory.stock_qty,
              viewed_at: entry.viewed_at,
            };
          })
          .filter(Boolean);

        console.log("✅ Final viewed products to display:", viewed.length);
        setViewedProducts(viewed);
      }
    }
  };

  const fetchWishlistCount = async () => {
    if (!user) return;
    
    const { count } = await supabase
      .from("wishlist")
      .select("*", { count: 'exact', head: true })
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

  const handleAddToWishlist = async (product: any) => {
    if (!user) return;

    const { error } = await supabase
      .from("wishlist")
      .insert({
        user_id: user.id,
        product_id: product.id,
      });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Already in wishlist",
          description: "This product is already in your wishlist.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add to wishlist.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Added to wishlist",
        description: `${product.name} has been added to your wishlist.`,
      });
    }
  };

  const handleAddToCart = async (product: any) => {
    if (!user) return;

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
          description: "Failed to create cart.",
          variant: "destructive",
        });
        return;
      }
      cart = newCart;
    }

    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("*")
      .eq("cart_id", cart.id)
      .eq("inventory_id", product.inventory_id)
      .single();

    if (existingItem) {
      const { error } = await supabase
        .from("cart_items")
        .update({ qty: existingItem.qty + 1 })
        .eq("id", existingItem.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update cart.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Updated cart",
          description: `Increased quantity of ${product.name}.`,
        });
      }
    } else {
      const { error } = await supabase
        .from("cart_items")
        .insert({
          cart_id: cart.id,
          inventory_id: product.inventory_id,
          qty: 1,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add to cart.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Added to cart",
          description: `${product.name} has been added to your cart.`,
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AmazonHeader
        wishlistCount={wishlistCount}
        cartCount={cartCount}
        avatarUrl={profile?.avatar_url}
        onSignOut={() => setShowSignOutDialog(true)}
        userRole="retailer"
      />

      <main className="w-full">
        {/* Hero Banner Carousel */}
        <AmazonHeroBanner banners={heroBanners} autoPlay interval={6000} />

        {/* Continue Shopping Section */}
        {viewedProducts.length > 0 && (
          <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-4">Continue Shopping</h2>
            <AmazonCarousel>
              {viewedProducts.map((product) => (
                <AmazonCarouselItem key={product.id} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5 xl:basis-1/6">
                  <AmazonProductCard
                    id={product.id}
                    slug={product.slug}
                    name={product.name}
                    price={product.price}
                    mrp={product.mrp}
                    image={extractFirstImage(product.images)}
                    rating={product.rating}
                    reviewCount={product.review_count}
                    onQuickView={() => setQuickViewProduct({...product, inStock: product.stock_qty > 0})}
                  />
                </AmazonCarouselItem>
              ))}
            </AmazonCarousel>
          </div>
        )}

        {/* Recommended Products Section */}
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6">Recommended for You</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <AmazonProductCard
                key={product.id}
                id={product.id}
                slug={product.slug}
                name={product.name}
                price={product.price}
                mrp={product.mrp}
                image={extractFirstImage(product.images)}
                rating={product.rating}
                reviewCount={product.review_count}
                onQuickView={() => setQuickViewProduct({...product, inStock: product.stock_qty > 0})}
              />
            ))}
          </div>
          {products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products available at the moment.</p>
            </div>
          )}
        </div>
      </main>

      <AmazonFooter />

      {/* Quick View Modal */}
      {quickViewProduct && (
        <AmazonQuickViewModal
          product={{
            ...quickViewProduct,
            image: extractFirstImage(quickViewProduct.images),
          }}
          open={!!quickViewProduct}
          onOpenChange={(open) => !open && setQuickViewProduct(null)}
          onAddToCart={(qty) => handleAddToCart(quickViewProduct)}
          onAddToWishlist={() => handleAddToWishlist(quickViewProduct)}
          onViewFull={() => {
            setQuickViewProduct(null);
            navigate(`/product/${quickViewProduct.slug}`);
          }}
        />
      )}

      <SignOutDialog
        open={showSignOutDialog}
        onOpenChange={setShowSignOutDialog}
        onConfirm={handleSignOut}
      />
    </div>
  );
};

export default RetailerWholesalerMarketplace;
