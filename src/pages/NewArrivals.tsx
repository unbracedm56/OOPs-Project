import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AmazonHeader, AmazonFooter, AmazonProductCard } from "@/components/amazon";
import { User } from "@supabase/supabase-js";
import { Sparkles } from "lucide-react";

const NewArrivals = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchNewArrivals();
      fetchWishlistCount();
      fetchCartCount();
    }
  }, [user]);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
    }
  };

  const fetchNewArrivals = async () => {
    // Fetch recently added products (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from("inventory")
      .select(
        `
        id,
        price,
        mrp,
        stock_qty,
        is_active,
        created_at,
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
        )
      `
      )
      .eq("is_active", true)
      .gt("stock_qty", 0)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setProducts(data.filter((item) => item.products !== null));
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

  const sanitizeImageUrl = (url: string | null | undefined) => {
    if (!url) return "/placeholder.svg";
    return url.replace(/^http:/, "https:") || "/placeholder.svg";
  };

  const extractFirstImage = (images: any): string => {
    if (!images) return "/placeholder.svg";
    if (Array.isArray(images) && images.length > 0) {
      return sanitizeImageUrl(typeof images[0] === "string" ? images[0] : images[0]?.url);
    }
    return "/placeholder.svg";
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
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
          <div className="mb-8 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-secondary to-secondary-hover">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-secondary via-primary to-accent bg-clip-text text-transparent">
                New Arrivals
              </h1>
              <p className="text-muted-foreground">
                Discover the latest products added to our store
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((item: any) => {
              const product = item.products;

              return (
                <AmazonProductCard
                  key={item.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  image={extractFirstImage(product.images)}
                  price={Number(item.price)}
                  mrp={item.mrp ? Number(item.mrp) : undefined}
                  rating={4 + Math.random()}
                  reviewCount={Math.floor(Math.random() * 500) + 50}
                  badge="NEW"
                  dealBadge={
                    item.mrp && item.mrp > item.price
                      ? `${Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF`
                      : undefined
                  }
                  inStock={item.stock_qty > 0}
                />
              );
            })}
          </div>

          {products.length === 0 && (
            <div className="text-center py-12 bg-muted rounded-lg">
              <p className="text-muted-foreground">
                No new arrivals at the moment. Check back soon!
              </p>
            </div>
          )}
        </div>
      </main>

      <AmazonFooter />
    </div>
  );
};

export default NewArrivals;
