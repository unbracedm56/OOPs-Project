import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import FeedbackForm from "@/components/FeedbackForm";

const OrderFeedback = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderItems();
  }, [orderId]);

  const fetchOrderItems = async () => {
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          *,
          inventory:inventory_id (
            products (
              id,
              name,
              images
            )
          )
        `)
        .eq("order_id", orderId);

      if (error) throw error;
      setOrderItems(data || []);
    } catch (error) {
      console.error("Error fetching order items:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/order-history")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>

        <h1 className="mb-6 text-3xl font-bold">Review Your Order</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {orderItems.map((item) => (
              <div key={item.id}>
                <div className="flex items-center gap-4 mb-4">
                  {item.inventory?.products?.images?.[0] && (
                    <img
                      src={item.inventory.products.images[0]}
                      alt={item.inventory.products.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{item.inventory?.products?.name}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {item.qty}</p>
                  </div>
                </div>
                <FeedbackForm
                  productId={item.inventory?.products?.id}
                  orderItemId={item.id}
                  onSuccess={() => {}}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderFeedback;
