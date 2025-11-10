import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const ViewCustomers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: stores } = await supabase
          .from("stores")
          .select("id")
          .eq("owner_id", user.id)
          .single();

        if (stores) {
          const channel = supabase
            .channel('retailer-orders-changes')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `store_id=eq.${stores.id}`
              },
              () => {
                fetchOrders();
              }
            )
            .subscribe();

          return () => {
            supabase.removeChannel(channel);
          };
        }
      }
    };

    setupRealtimeSubscription();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: store } = await supabase
        .from("stores")
        .select("id, type")
        .eq("owner_id", user.id)
        .single();

      if (!store) return;

      const { data: ordersData, error } = await supabase
        .from("orders")
        .select(`
          *,
          profiles:customer_id (
            full_name,
            phone
          ),
          addresses:delivery_address_id (
            line1,
            line2,
            city,
            state,
            pincode
          ),
          order_items (
            *,
            inventory:inventory_id (
              price,
              delivery_days,
              products (
                name,
                images
              )
            )
          )
        `)
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(ordersData || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const validStatuses = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"];
      if (!validStatuses.includes(newStatus)) {
        toast({
          title: "Error",
          description: "Invalid order status",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus as any })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order status updated successfully"
      });

      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  const updateDeliveryDate = async (orderId: string, date: Date | undefined) => {
    if (!date) return;

    try {
      const { error } = await supabase
        .from("orders")
        .update({ delivery_date: format(date, "yyyy-MM-dd") })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Delivery date updated successfully"
      });

      fetchOrders();
    } catch (error) {
      console.error("Error updating delivery date:", error);
      toast({
        title: "Error",
        description: "Failed to update delivery date",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "default";
      case "shipped": return "secondary";
      case "confirmed": case "packed": return "outline";
      case "cancelled": case "refunded": return "destructive";
      default: return "secondary";
    }
  };

  const getEstimatedDelivery = (order: any) => {
    const maxDeliveryDays = Math.max(
      ...order.order_items.map((item: any) => item.inventory?.delivery_days || 3)
    );
    const deliveryDate = new Date(order.placed_at);
    deliveryDate.setDate(deliveryDate.getDate() + maxDeliveryDays);
    return deliveryDate.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-6xl">
        <Button variant="ghost" onClick={() => navigate("/retailer-dashboard")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="mb-6 text-3xl font-bold">Customer Orders</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No orders yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Order #{order.order_number}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Customer: {order.profiles?.full_name || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Phone: {order.profiles?.phone || 'N/A'}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold mb-1">Delivery Address:</p>
                      <p className="text-sm text-muted-foreground">
                        {order.addresses?.line1}, {order.addresses?.line2 && `${order.addresses.line2}, `}
                        {order.addresses?.city}, {order.addresses?.state} - {order.addresses?.pincode}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold mb-2">Items:</p>
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex gap-2 items-center mb-2">
                          {item.inventory?.products?.images?.[0] && (
                            <img 
                              src={item.inventory.products.images[0]} 
                              alt={item.inventory?.products?.name || 'Product'} 
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <span className="text-sm">
                            {item.inventory?.products?.name || 'Product'} × {item.qty}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Amount</p>
                          <p className="text-lg font-bold">₹{order.total.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            Est. Delivery: {getEstimatedDelivery(order)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-[200px]">
                          <p className="text-sm font-medium mb-2">Order Status</p>
                          <Select
                            value={order.status}
                            onValueChange={(value) => updateOrderStatus(order.id, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="packed">Packed</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex-1 min-w-[200px]">
                          <p className="text-sm font-medium mb-2">Delivery Date</p>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !order.delivery_date && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {order.delivery_date ? (
                                  format(new Date(order.delivery_date), "PPP")
                                ) : (
                                  <span>Set delivery date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={order.delivery_date ? new Date(order.delivery_date) : undefined}
                                onSelect={(date) => updateDeliveryDate(order.id, date)}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewCustomers;
