import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FeedbackForm from "./FeedbackForm";

interface ReviewButtonProps {
  productId: string;
  productName: string;
  orderItemId: string;
  hasReviewed?: boolean;
  orderStatus: string;
}

export const ReviewButton = ({
  productId,
  productName,
  orderItemId,
  hasReviewed = false,
  orderStatus,
}: ReviewButtonProps) => {
  const [open, setOpen] = useState(false);

  // Only show review button if order is delivered
  if (orderStatus !== "delivered") {
    return null;
  }

  if (hasReviewed) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Star className="h-4 w-4 mr-2 fill-yellow-400 text-yellow-400" />
        Reviewed
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Star className="h-4 w-4 mr-2" />
          Write Review
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review: {productName}</DialogTitle>
          <DialogDescription>
            Share your experience with this product to help other shoppers
          </DialogDescription>
        </DialogHeader>
        <FeedbackForm
          productId={productId}
          orderItemId={orderItemId}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
