import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AmazonHeader, AmazonFooter, AmazonCategoryCard } from "@/components/amazon";
import { User } from "@supabase/supabase-js";

const Categories = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchCategories();
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

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .is("parent_id", null)
      .order("name");

    if (data) setCategories(data);
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
    navigate("/");
  };

  const getCategoryImage = (category: any) => {
    // If category has an image_url, use it
    if (category.image_url) {
      return category.image_url.replace(/^http:/, "https:");
    }
    
    // Default images based on category name
    const categoryName = category.name?.toLowerCase() || '';
    const defaultImages: Record<string, string> = {
      'electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop',
      'clothing': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop',
      'fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop',
      'home': 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400&h=400&fit=crop',
      'kitchen': 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=400&fit=crop',
      'sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=400&fit=crop',
      'books': 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=400&fit=crop',
      'toys': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=400&fit=crop',
      'beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop',
      'grocery': 'https://images.unsplash.com/photo-1543168256-418811576931?w=400&h=400&fit=crop',
      'food': 'https://images.unsplash.com/photo-1543168256-418811576931?w=400&h=400&fit=crop',
    };
    
    // Find matching category
    for (const [key, imageUrl] of Object.entries(defaultImages)) {
      if (categoryName.includes(key)) {
        return imageUrl;
      }
    }
    
    // Default placeholder
    return 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=400&fit=crop';
  };

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
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              All Categories
            </h1>
            <p className="text-muted-foreground">
              Browse products by category and find exactly what you need
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <AmazonCategoryCard
                key={category.id}
                title={category.name}
                image={getCategoryImage(category)}
                onClick={() => navigate(`/category/${category.id}`)}
              />
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12 bg-muted rounded-lg">
              <p className="text-muted-foreground">
                No categories available at the moment.
              </p>
            </div>
          )}
        </div>
      </main>

      <AmazonFooter />
    </div>
  );
};

export default Categories;
