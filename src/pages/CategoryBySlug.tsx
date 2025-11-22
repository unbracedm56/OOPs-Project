import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AmazonHeader, AmazonFooter, AmazonProductCard } from "@/components/amazon";
import { User } from "@supabase/supabase-js";
import { Layers } from "lucide-react";

// Map of slug to category name for searching
const CATEGORY_SLUG_MAP: Record<string, string[]> = {
  electronics: ["Electronics", "Electronic", "Technology", "Gadgets"],
  fashion: ["Fashion", "Clothing", "Apparel", "Wear"],
  "home-kitchen": ["Home", "Kitchen", "Home & Kitchen", "Homeware"],
};

const CategoryBySlug = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user && slug) {
      fetchCategoryBySlug();
    }
  }, [user, slug]);

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

  const fetchCategoryBySlug = async () => {
    if (!slug) return;

    try {
      // Try to find category by matching name patterns
      const searchTerms = CATEGORY_SLUG_MAP[slug] || [slug];
      
      // Search for category by name (case insensitive)
      const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .ilike("name", `%${searchTerms[0]}%`)
        .limit(1);

      if (categories && categories.length > 0) {
        const foundCategory = categories[0];
        setCategory(foundCategory);
        await fetchProductsByCategory(foundCategory.id);
        fetchWishlistCount();
        fetchCartCount();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching category:", error);
      setLoading(false);
    }
  };

  const fetchProductsByCategory = async (categoryId: string) => {
    try {
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
            category_id
          )
        `
        )
        .eq("is_active", true)
        .gt("stock_qty", 0)
        .eq("products.category_id", categoryId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setProducts(data.filter((item) => item.products !== null));
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
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

  const getCategoryDisplayName = () => {
    if (category?.name) return category.name;
    if (slug === "home-kitchen") return "Home & Kitchen";
    return slug?.charAt(0).toUpperCase() + slug?.slice(1);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AmazonHeader
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        userName={profile?.full_name?.split(" ")[0]}
        avatarUrl={profile?.avatar_url}
        onSignOut={handleSignOut}
      />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary">
              <Layers className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {getCategoryDisplayName()}
              </h1>
              <p className="text-muted-foreground">
                {category?.description || "Browse products in this category"}
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
                No products found in this category.
              </p>
            </div>
          )}
        </div>
      </main>

      <AmazonFooter />
    </div>
  );
};

export default CategoryBySlug;
