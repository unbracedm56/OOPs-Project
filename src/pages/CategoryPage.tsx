import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CategoryPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryId = searchParams.get("id");
  const categoryName = searchParams.get("name");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [categoryId]);

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from("inventory")
        .select(`
          *,
          products (
            id,
            name,
            slug,
            description,
            images,
            category_id
          )
        `)
        .eq("is_active", true)
        .gt("stock_qty", 0);

      if (categoryId) {
        query = query.eq("products.category_id", categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const formattedProducts = (data || [])
        .filter((item: any) => item.products !== null)
        .map((item: any) => ({
          id: item.products.id,
          name: item.products.name,
          slug: item.products.slug,
          description: item.products.description,
          price: item.price,
          stock_quantity: item.stock_qty,
          image_url: Array.isArray(item.products.images) ? item.products.images[0] : null,
        }));
      
      setProducts(formattedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-7xl">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="mb-6 text-3xl font-bold">{categoryName || "All Products"}</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer transition-all hover:shadow-lg"
                onClick={() => navigate(`/product/${product.slug}`)}
              >
                <CardContent className="p-4">
                  <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-muted">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <h3 className="mb-2 font-semibold">{product.name}</h3>
                  <p className="mb-2 text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold">${product.price}</p>
                    <Badge variant="secondary">{product.stock_quantity} in stock</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No products found in this category
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
