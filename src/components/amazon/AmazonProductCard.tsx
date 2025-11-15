import { Star, StarHalf, Heart, Eye, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AmazonProductCardProps {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  mrp?: number;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  dealBadge?: string;
  inStock?: boolean;
  onQuickView?: () => void;
}

export const AmazonProductCard = ({
  id,
  name,
  slug,
  image,
  price,
  mrp,
  rating = 0,
  reviewCount = 0,
  badge,
  dealBadge,
  inStock = true,
  onQuickView,
}: AmazonProductCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [imageError, setImageError] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    checkWishlistStatus();
  }, [id]);

  const checkWishlistStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error checking wishlist:", error);
        return;
      }

      setIsWishlisted(!!data);
    } catch (error) {
      console.error("Error checking wishlist:", error);
    }
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (wishlistLoading) return;
    
    setWishlistLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to add items to wishlist",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      if (isWishlisted) {
        // Remove from wishlist
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", id);

        if (error) throw error;

        setIsWishlisted(false);
        toast({
          title: "Removed from wishlist",
          description: "Item removed from your wishlist",
        });
      } else {
        // Add to wishlist
        const { error } = await supabase
          .from("wishlist")
          .insert({
            user_id: user.id,
            product_id: id,
          });

        if (error) throw error;

        setIsWishlisted(true);
        toast({
          title: "Added to wishlist",
          description: "Item added to your wishlist",
        });
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      });
    } finally {
      setWishlistLoading(false);
    }
  };

  const discountPercent = mrp && mrp > price 
    ? Math.round(((mrp - price) / mrp) * 100) 
    : 0;

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="h-3.5 w-3.5 fill-warning text-warning" />);
    }
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="h-3.5 w-3.5 fill-warning text-warning" />);
    }
    const remaining = 5 - Math.ceil(rating);
    for (let i = 0; i < remaining; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-3.5 w-3.5 text-muted-foreground/30" />);
    }
    return stars;
  };

  return (
    <Card 
      className="group cursor-pointer border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300 overflow-hidden bg-card relative"
      onClick={() => navigate(`/product/${slug}`)}
    >
      {/* Wishlist Button */}
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
        onClick={toggleWishlist}
        disabled={wishlistLoading}
      >
        <Heart className={`h-4 w-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
      </Button>

      <div className="relative">
        {/* Deal Badge */}
        {dealBadge && (
          <div className="absolute top-2 left-2 z-10">
            <Badge className="bg-accent text-accent-foreground font-bold px-2 py-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {dealBadge}
            </Badge>
          </div>
        )}

        {/* Image */}
        <div className="aspect-square bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center p-4 relative overflow-hidden">
          <img
            src={imageError ? "/placeholder.svg" : image}
            alt={name}
            className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
          
          {/* Quick View Overlay */}
          {onQuickView && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                size="sm"
                variant="secondary"
                className="gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickView();
                }}
              >
                <Eye className="h-4 w-4" />
                Quick View
              </Button>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-2">
        {/* Badge */}
        {badge && (
          <Badge variant="outline" className="text-xs mb-1 border-primary/30 text-primary">
            {badge}
          </Badge>
        )}

        {/* Product Name */}
        <h3 className="text-sm font-medium line-clamp-2 text-foreground group-hover:text-primary transition-colors min-h-[2.5rem]">
          {name}
        </h3>

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {renderStars(rating)}
            </div>
            <span className="text-xs font-medium text-foreground">
              {rating.toFixed(1)}
            </span>
            {reviewCount > 0 && (
              <span className="text-xs text-muted-foreground">
                ({reviewCount.toLocaleString()})
              </span>
            )}
          </div>
        )}

        {/* Price Section */}
        <div className="pt-2 space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              ₹{price.toLocaleString()}
            </span>
            {mrp && mrp > price && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{mrp.toLocaleString()}
              </span>
            )}
          </div>

          {/* Discount Badge */}
          {discountPercent > 0 && (
            <Badge variant="secondary" className="bg-success/10 text-success border-0">
              Save {discountPercent}%
            </Badge>
          )}
        </div>

        {/* Stock Status */}
        {!inStock && (
          <p className="text-xs font-semibold text-destructive pt-1">
            Out of stock
          </p>
        )}

        {inStock && (
          <p className="text-xs font-medium text-success pt-1">
            In Stock
          </p>
        )}
      </CardContent>
    </Card>
  );
};
