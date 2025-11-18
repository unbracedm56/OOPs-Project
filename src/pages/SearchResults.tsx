import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AmazonHeader } from "@/components/amazon/AmazonHeader";
import { AmazonFooter } from "@/components/amazon/AmazonFooter";
import { AmazonProductCard } from "@/components/amazon/AmazonProductCard";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  price: number;
  mrp: number;
  stock_qty: number;
  is_active: boolean;
  products: {
    id: string;
    name: string;
    slug: string;
    description: string;
    images: string;
    brand: string;
    category_id: string;
  };
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    fetchProfile();
    fetchCounts();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      searchProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [searchQuery]);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
    }
  };

  const fetchCounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { count: cartCount } = await supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      const { count: wishlistCount } = await supabase
        .from("wishlist")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      setCartCount(cartCount || 0);
      setWishlistCount(wishlistCount || 0);
    }
  };

  const searchProducts = async () => {
    setLoading(true);
    try {
      // Check if search query is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUUID = uuidRegex.test(searchQuery);

      // Split search query into words for better fuzzy matching
      const searchWords = searchQuery.trim().toLowerCase().split(/\s+/);
      
      // Build the search filter for exact and partial matches
      const searchPattern = `%${searchQuery}%`;
      let searchFilter = `name.ilike.${searchPattern},description.ilike.${searchPattern},brand.ilike.${searchPattern}`;
      if (isUUID) {
        searchFilter += `,id.eq.${searchQuery}`;
      }

      // First pass: Exact and partial matches with original query
      const { data: exactMatches, error: exactError } = await supabase
        .from("products")
        .select("id, name, slug, description, images, brand, category_id")
        .or(searchFilter)
        .limit(50);

      if (exactError) throw exactError;

      let allProductsData = exactMatches || [];

      // Second pass: Fuzzy matching for individual words if we have few results
      if (allProductsData.length < 10 && searchWords.length > 0) {
        // Build OR conditions for each word
        const wordFilters = searchWords
          .map(word => {
            const wordPattern = `%${word}%`;
            return `name.ilike.${wordPattern},description.ilike.${wordPattern},brand.ilike.${wordPattern}`;
          })
          .join(',');

        const { data: fuzzyMatches, error: fuzzyError } = await supabase
          .from("products")
          .select("id, name, slug, description, images, brand, category_id")
          .or(wordFilters)
          .limit(50);

        if (!fuzzyError && fuzzyMatches) {
          // Merge results, avoiding duplicates
          const existingIds = new Set(allProductsData.map(p => p.id));
          const newMatches = fuzzyMatches.filter(p => !existingIds.has(p.id));
          allProductsData = [...allProductsData, ...newMatches];
        }
      }

      if (allProductsData.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Calculate relevance scores for sorting
      const scoredProducts = allProductsData.map(product => {
        let score = 0;
        const lowerQuery = searchQuery.toLowerCase();
        const lowerName = (product.name || "").toLowerCase();
        const lowerBrand = (product.brand || "").toLowerCase();
        const lowerDesc = (product.description || "").toLowerCase();

        // Exact name match gets highest score
        if (lowerName === lowerQuery) score += 100;
        // Name starts with query
        else if (lowerName.startsWith(lowerQuery)) score += 80;
        // Name contains query
        else if (lowerName.includes(lowerQuery)) score += 60;
        
        // Brand matching
        if (lowerBrand === lowerQuery) score += 50;
        else if (lowerBrand.includes(lowerQuery)) score += 30;
        
        // Description matching
        if (lowerDesc.includes(lowerQuery)) score += 20;

        // Word-by-word matching bonus
        searchWords.forEach(word => {
          if (lowerName.includes(word)) score += 10;
          if (lowerBrand.includes(word)) score += 5;
        });

        return { ...product, relevanceScore: score };
      });

      // Sort by relevance score (highest first)
      scoredProducts.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Get product IDs
      const productIds = scoredProducts.map(p => p.id);

      // Now get inventory for these products
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory")
        .select(`
          id,
          price,
          mrp,
          stock_qty,
          is_active,
          product_id
        `)
        .in("product_id", productIds)
        .eq("is_active", true)
        .gt("stock_qty", 0);

      if (inventoryError) throw inventoryError;

      // Combine products with their inventory, maintaining relevance order
      const productMap = new Map(scoredProducts.map(p => [p.id, p]));
      const combinedData = (inventoryData || [])
        .map(inv => {
          const product = productMap.get(inv.product_id);
          return product ? {
            id: inv.id,
            price: inv.price,
            mrp: inv.mrp,
            stock_qty: inv.stock_qty,
            is_active: inv.is_active,
            products: product,
            relevanceScore: product.relevanceScore
          } : null;
        })
        .filter(item => item !== null)
        .sort((a, b) => (b?.relevanceScore || 0) - (a?.relevanceScore || 0));

      console.log("Search results:", combinedData); // Debug log
      setProducts(combinedData);
    } catch (error) {
      console.error("Error searching products:", error);
      toast({
        title: "Error",
        description: "Failed to search products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const extractFirstImage = (images: string | null): string => {
    if (!images) return "/placeholder.svg";
    
    try {
      const imageArray = JSON.parse(images);
      return Array.isArray(imageArray) && imageArray.length > 0
        ? imageArray[0]
        : "/placeholder.svg";
    } catch {
      return images || "/placeholder.svg";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AmazonHeader
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        userName={profile?.full_name}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
            Search Results
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Search className="h-4 w-4" />
            {searchQuery ? (
              <>
                Showing results for <span className="font-semibold text-foreground">"{searchQuery}"</span>
                {!loading && <span className="text-sm">({products.length} {products.length === 1 ? 'result' : 'results'})</span>}
              </>
            ) : (
              "Enter a search query to find products"
            )}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* No Query */}
        {!searchQuery && !loading && (
          <div className="text-center py-20">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
              <Search className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Start Searching</h3>
            <p className="text-muted-foreground">
              Use the search bar above to find products
            </p>
          </div>
        )}

        {/* No Results */}
        {searchQuery && !loading && products.length === 0 && (
          <div className="text-center py-20">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
              <Search className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground mb-6">
              We couldn't find any products matching "{searchQuery}"
            </p>
            <p className="text-sm text-muted-foreground">
              Try different keywords or browse our categories
            </p>
          </div>
        )}

        {/* Results Grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((item) => {
              const product = item.products;
              if (!product) return null;
              
              return (
                <AmazonProductCard
                  key={item.id}
                  id={product.id}
                  name={product.name || "Unnamed Product"}
                  slug={product.slug || product.id}
                  price={Number(item.price) || 0}
                  mrp={Number(item.mrp) || Number(item.price) || 0}
                  image={extractFirstImage(product.images)}
                  rating={4 + Math.random()}
                  reviewCount={Math.floor(Math.random() * 500) + 50}
                  badge={product.brand}
                  dealBadge={
                    item.mrp && item.mrp > item.price
                      ? `${Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF`
                      : undefined
                  }
                  inStock={item.stock_qty > 0}
                  onQuickView={() => navigate(`/product/${product.slug || product.id}`)}
                />
              );
            })}
          </div>
        )}
      </main>

      <AmazonFooter />
    </div>
  );
}
