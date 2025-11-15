import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ViewedProduct {
  id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  mrp?: number;
  viewed_at: string;
  category?: {
    name: string;
  };
}

type HistoryRow = {
  viewed_at: string;
  product_id: string;
};

export const ContinueShoppingCarousel = () => {
  const [viewedProducts, setViewedProducts] = useState<ViewedProduct[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const itemsPerPage = 4;

  const sanitizeImageUrl = (url: string | null | undefined) => {
    if (!url) return "/placeholder.svg";
    let cleaned = url.replace(/^\"|\"$/g, "").replace(/^\'|\'$/g, "").trim();
    cleaned = cleaned.replace(/^http:/, "https:");
    return cleaned || "/placeholder.svg";
  };

  const extractImages = (value: unknown): string[] => {
    if (!value) return [];

    const urls: string[] = [];
    const register = (candidate: unknown) => {
      if (typeof candidate === "string" && candidate.trim()) {
        urls.push(sanitizeImageUrl(candidate));
      }
    };

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === "string") {
          register(item);
        } else if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          const maybe = record.url ?? record.src ?? record.image;
          register(typeof maybe === "string" ? maybe : undefined);
        }
      });
    } else if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return extractImages(parsed);
      } catch {
        register(value);
      }
    }

    return urls;
  };

  useEffect(() => {
    fetchViewHistory();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('product_view_history_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_view_history',
        },
        () => {
          fetchViewHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchViewHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First get the view history with product IDs
      const { data: historyData, error: historyError } = await supabase
        .from('product_view_history')
        .select('product_id, viewed_at')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(12);

      if (historyError) throw historyError;

      if (!historyData || historyData.length === 0) {
        setViewedProducts([]);
        return;
      }

      const historyRows = (historyData ?? []) as unknown as HistoryRow[];
      
      // Get unique product IDs
      const productIds = [...new Set(historyRows.map(h => h.product_id))];

      // Fetch product details with their inventory (for price/mrp)
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          images,
          categories(name)
        `)
        .in('id', productIds);

      if (productsError) throw productsError;

      // Fetch inventory data for these products (get cheapest retailer price)
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          product_id,
          price,
          mrp,
          stores!inner(type)
        `)
        .in('product_id', productIds)
        .eq('stores.type', 'retailer')
        .eq('is_active', true)
        .gt('stock_qty', 0);

      if (inventoryError) throw inventoryError;

      // Combine the data
      const products = historyRows
        .map((entry) => {
          const product = productsData?.find(p => p.id === entry.product_id);
          if (!product) return null;

          // Get the cheapest inventory item for this product
          const inventoryItems = inventoryData?.filter(inv => inv.product_id === entry.product_id) || [];
          const cheapestInventory = inventoryItems.reduce((min, item) => 
            !min || Number(item.price) < Number(min.price) ? item : min
          , inventoryItems[0]);

          if (!cheapestInventory) return null;

          return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            images: extractImages(product.images),
            price: Number(cheapestInventory.price),
            mrp: cheapestInventory.mrp ? Number(cheapestInventory.mrp) : undefined,
            viewed_at: entry.viewed_at,
            category: product.categories ?? undefined,
          };
        })
        .filter(Boolean) as ViewedProduct[];

      if (products.length === 0) {
        setViewedProducts([]);
        return;
      }

      setViewedProducts(products);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching view history:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (currentIndex + itemsPerPage < viewedProducts.length) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-48 mb-4"></div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (viewedProducts.length === 0) {
    return null;
  }

  const visibleProducts = viewedProducts.slice(currentIndex, currentIndex + itemsPerPage);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Continue Shopping</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            disabled={currentIndex + itemsPerPage >= viewedProducts.length}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleProducts.map((product) => {
          const imageUrl = product.images.length > 0 ? product.images[0] : '/placeholder.svg';

          return (
          <Card
            key={product.id}
            className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
            onClick={() => navigate(`/product/${product.slug}`)}
          >
            <div className="aspect-square overflow-hidden bg-muted">
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                onError={(event) => {
                  event.currentTarget.src = '/placeholder.svg';
                }}
              />
            </div>
            <CardContent className="p-4">
              <div className="mb-2">
                {product.category && (
                  <Badge variant="secondary" className="text-xs mb-2">
                    {product.category.name}
                  </Badge>
                )}
                <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                  {product.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.mrp && product.mrp > product.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    ₹{product.mrp.toLocaleString()}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
        })}
      </div>
    </div>
  );
};
