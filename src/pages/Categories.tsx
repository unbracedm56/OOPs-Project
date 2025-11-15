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
                image="/placeholder.svg"
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
