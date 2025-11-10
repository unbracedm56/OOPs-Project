import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

interface ReviewsListProps {
  productId: string;
}

const ReviewsList = ({ productId }: ReviewsListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select(`
          id,
          rating,
          title,
          body,
          created_at,
          profiles:author_id (
            full_name
          )
        `)
        .eq("product_id", productId)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No reviews yet. Be the first to review this product!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Avatar>
                <AvatarFallback>
                  {review.profiles?.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold">{review.profiles?.full_name || "Anonymous"}</p>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
                {review.title && (
                  <p className="font-medium mb-1">{review.title}</p>
                )}
                {review.body && (
                  <p className="text-sm text-muted-foreground">{review.body}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ReviewsList;
