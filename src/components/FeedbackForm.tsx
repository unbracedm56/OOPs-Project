import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface FeedbackFormProps {
  productId: string;
  orderItemId?: string;
  onSuccess?: () => void;
}

const FeedbackForm = ({ productId, orderItemId, onSuccess }: FeedbackFormProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("feedback")
        .insert({
          product_id: productId,
          order_item_id: orderItemId,
          author_id: user.id,
          rating,
          title,
          body,
          is_published: false
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your review has been submitted and is pending approval"
      });

      setRating(0);
      setTitle("");
      setBody("");
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Rating</Label>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summary of your review"
              required
            />
          </div>

          <div>
            <Label htmlFor="body">Review</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your experience with this product"
              rows={4}
            />
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FeedbackForm;
