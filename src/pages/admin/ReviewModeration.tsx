import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Star, Check, X, Clock } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Review {
  id: string;
  product_id: string;
  author_id: string;
  rating: number;
  title: string;
  body: string;
  is_published: boolean;
  created_at: string;
  profiles: {
    full_name: string;
  };
  products: {
    name: string;
  };
}

const ReviewModeration = () => {
  const { loading } = useAdminCheck();
  const { toast } = useToast();
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [publishedReviews, setPublishedReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const { data: pending, error: pendingError } = await supabase
        .from("feedback")
        .select(`
          *,
          profiles(full_name),
          products(name)
        `)
        .eq("is_published", false)
        .order("created_at", { ascending: false });

      if (pendingError) throw pendingError;

      const { data: published, error: publishedError } = await supabase
        .from("feedback")
        .select(`
          *,
          profiles(full_name),
          products(name)
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (publishedError) throw publishedError;

      setPendingReviews(pending as Review[]);
      setPublishedReviews(published as Review[]);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch reviews",
      });
    } finally {
      setLoadingReviews(false);
    }
  };

  const approveReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from("feedback")
        .update({ is_published: true })
        .eq("id", reviewId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Review approved and published",
      });

      fetchReviews();
    } catch (error) {
      console.error("Error approving review:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve review",
      });
    }
  };

  const rejectReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from("feedback")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Review rejected and deleted",
      });

      fetchReviews();
    } catch (error) {
      console.error("Error rejecting review:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject review",
      });
    }
  };

  const unpublishReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from("feedback")
        .update({ is_published: false })
        .eq("id", reviewId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Review unpublished",
      });

      fetchReviews();
    } catch (error) {
      console.error("Error unpublishing review:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to unpublish review",
      });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const ReviewCard = ({ review, isPending }: { review: Review; isPending: boolean }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{review.title || "No title"}</CardTitle>
            <CardDescription>
              by {review.profiles?.full_name} • {review.products?.name}
            </CardDescription>
          </div>
          <Badge variant={isPending ? "secondary" : "default"} className="gap-1">
            {isPending ? <Clock className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            {isPending ? "Pending" : "Published"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>{renderStars(review.rating)}</div>
        
        <p className="text-sm text-muted-foreground">{review.body}</p>
        
        <div className="text-xs text-muted-foreground">
          Submitted on {new Date(review.created_at).toLocaleDateString()}
        </div>

        <div className="flex gap-2 pt-2">
          {isPending ? (
            <>
              <Button
                size="sm"
                onClick={() => approveReview(review.id)}
                className="gap-1"
              >
                <Check className="h-4 w-4" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => rejectReview(review.id)}
                className="gap-1"
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => unpublishReview(review.id)}
              >
                Unpublish
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => rejectReview(review.id)}
                className="gap-1"
              >
                <X className="h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading || loadingReviews) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        
        <div className="flex-1">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              <h1 className="text-xl font-bold">Review Moderation</h1>
            </div>
          </header>

          <main className="p-6">
            <Tabs defaultValue="pending" className="space-y-6">
              <TabsList>
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Pending ({pendingReviews.length})
                </TabsTrigger>
                <TabsTrigger value="published" className="gap-2">
                  <Check className="h-4 w-4" />
                  Published ({publishedReviews.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {pendingReviews.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Check className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">No pending reviews</p>
                      <p className="text-sm text-muted-foreground">
                        All reviews have been moderated
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  pendingReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} isPending={true} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="published" className="space-y-4">
                {publishedReviews.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">No published reviews</p>
                      <p className="text-sm text-muted-foreground">
                        Approved reviews will appear here
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  publishedReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} isPending={false} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ReviewModeration;
