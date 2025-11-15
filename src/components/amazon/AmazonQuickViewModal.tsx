import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { useState } from "react";

interface QuickViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id?: string;
    name: string;
    slug: string;
    image: string;
    images?: string[];
    price: number;
    mrp?: number;
    rating?: number;
    reviewCount?: number;
    description?: string;
    brand?: string;
    category?: string;
    inStock?: boolean;
  } | null;
  onAddToCart?: (quantity?: number) => void;
  onAddToWishlist?: () => void;
  onViewFull?: () => void;
}

export const AmazonQuickViewModal = ({
  open,
  onOpenChange,
  product,
  onAddToCart,
  onAddToWishlist,
  onViewFull,
}: QuickViewModalProps) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const images = product.images || [product.image];
  const discountPercent =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-[#FF9900] text-[#FF9900]"
              : "text-gray-300"
          }`}
        />
      );
    }
    return stars;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Quick View</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`aspect-square rounded border-2 overflow-hidden ${
                      selectedImage === idx
                        ? "border-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            {product.brand && (
              <p className="text-sm text-primary hover:underline cursor-pointer">
                Visit the {product.brand} Store
              </p>
            )}

            <h2 className="text-2xl font-normal text-foreground">
              {product.name}
            </h2>

            {product.rating && product.rating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {renderStars(product.rating)}
                </div>
                <span className="text-sm text-primary hover:underline cursor-pointer">
                  {product.rating} out of 5
                </span>
                {product.reviewCount && product.reviewCount > 0 && (
                  <span className="text-sm text-muted-foreground">
                    ({product.reviewCount.toLocaleString()} ratings)
                  </span>
                )}
              </div>
            )}

            <div className="border-t border-b border-border py-4 space-y-2">
              {/* Price */}
              <div className="flex items-baseline gap-2">
                {discountPercent > 0 && (
                  <Badge variant="destructive" className="text-sm">
                    -{discountPercent}%
                  </Badge>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-muted-foreground">₹</span>
                  <span className="text-3xl font-normal">
                    {product.price.toLocaleString()}
                  </span>
                </div>
              </div>

              {product.mrp && product.mrp > product.price && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">M.R.P.:</span>
                  <span className="text-sm text-muted-foreground line-through">
                    ₹{product.mrp.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Stock Status */}
              {product.inStock !== false ? (
                <p className="text-sm font-semibold text-success">In Stock</p>
              ) : (
                <p className="text-sm font-semibold text-destructive">
                  Currently unavailable
                </p>
              )}
            </div>

            {product.description && (
              <div>
                <h4 className="font-semibold mb-2">About this item</h4>
                <p className="text-sm text-muted-foreground line-clamp-4">
                  {product.description}
                </p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold">Quantity:</span>
              <select
                className="border border-border rounded px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                className="w-full bg-secondary hover:bg-secondary-hover text-secondary-foreground"
                size="lg"
                onClick={() => onAddToCart && onAddToCart(quantity)}
                disabled={product.inStock === false}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>

              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={onAddToWishlist}
              >
                <Heart className="h-5 w-5 mr-2" />
                Add to Wishlist
              </Button>

              <Button
                variant="link"
                className="w-full"
                onClick={onViewFull}
              >
                View full details →
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
