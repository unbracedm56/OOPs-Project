import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription for new orders
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const channel = supabase
          .channel('orders-changes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'orders',
              filter: `customer_id=eq.${user.id}`
            },
            () => {
              fetchOrders(); // Refresh orders when a new one is inserted
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
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

      const { data: ordersData, error } = await supabase
        .from("orders")
        .select(`
          *,
          stores:store_id (
            name,
            phone,
            type
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
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(ordersData || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "default";
      case "shipped":
        return "secondary";
      case "confirmed":
      case "packed":
        return "outline";
      case "cancelled":
      case "refunded":
        return "destructive";
      default:
        return "secondary";
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

  const getOrderProgress = (status: string) => {
    const stages = ["pending", "confirmed", "packed", "shipped", "delivered"];
    const currentIndex = stages.indexOf(status);
    if (currentIndex === -1) return 0;
    return ((currentIndex + 1) / stages.length) * 100;
  };

  const getStatusSteps = () => [
    { status: "pending", label: "Order Placed", icon: "📦" },
    { status: "confirmed", label: "Confirmed", icon: "✓" },
    { status: "packed", label: "Packed", icon: "📦" },
    { status: "shipped", label: "Shipped", icon: "🚚" },
    { status: "delivered", label: "Delivered", icon: "✓" }
  ];

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="mb-6 text-3xl font-bold">Order History</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No orders yet</p>
              <Button className="mt-4" onClick={() => navigate("/dashboard")}>
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const statusSteps = getStatusSteps();
              const currentStepIndex = statusSteps.findIndex(s => s.status === order.status);
              
              return (
                <Card 
                  key={order.id} 
                  className="transition-all hover:shadow-lg cursor-pointer overflow-hidden"
                  onClick={() => toggleOrderExpand(order.id)}
                >
                  <CardContent className="p-6">
                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-semibold text-lg">Order #{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          Ordered: {new Date(order.placed_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Store: {order.stores?.name || 'N/A'} ({order.stores?.type || 'N/A'})
                        </p>
                      </div>
                      <Badge variant={getStatusColor(order.status)} className="text-sm">
                        {order.status}
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between mb-2">
                        {statusSteps.map((step, index) => {
                          const isCompleted = index <= currentStepIndex;
                          const isCurrent = index === currentStepIndex;
                          
                          return (
                            <div key={step.status} className="flex flex-col items-center flex-1">
                              <div 
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${
                                  isCompleted 
                                    ? 'bg-primary text-primary-foreground scale-110' 
                                    : 'bg-muted text-muted-foreground'
                                } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                              >
                                {step.icon}
                              </div>
                              <p className={`text-xs mt-1 text-center ${
                                isCompleted ? 'text-primary font-medium' : 'text-muted-foreground'
                              }`}>
                                {step.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out"
                          style={{ width: `${getOrderProgress(order.status)}%` }}
                        />
                      </div>
                    </div>

                    {/* Collapsed View - Quick Preview */}
                    {!isExpanded && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {order.order_items?.slice(0, 3).map((item: any, idx: number) => (
                            item.inventory?.products?.images?.[0] && (
                              <img 
                                key={item.id}
                                src={item.inventory.products.images[0]} 
                                alt={item.inventory?.products?.name || 'Product'} 
                                className="w-12 h-12 object-cover rounded border"
                              />
                            )
                          ))}
                          {order.order_items?.length > 3 && (
                            <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center text-xs font-medium">
                              +{order.order_items.length - 3}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="text-xl font-bold">₹{order.total.toFixed(2)}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Click to view details
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Expanded View - Full Details */}
                    {isExpanded && (
                      <div className="space-y-4 animate-accordion-down">
                        {/* Delivery Address */}
                        {order.addresses && (
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                              📍 Delivery Address
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.addresses.line1}, {order.addresses.line2 && `${order.addresses.line2}, `}
                              {order.addresses.city}, {order.addresses.state} - {order.addresses.pincode}
                            </p>
                          </div>
                        )}

                        {/* Estimated Delivery */}
                        <div className="p-4 bg-primary/10 rounded-lg">
                          <p className="text-sm font-semibold mb-1">🚚 Estimated Delivery</p>
                          <p className="text-sm">{getEstimatedDelivery(order)}</p>
                        </div>

                        {/* All Items */}
                        <div>
                          <p className="text-sm font-semibold mb-3">📦 Order Items</p>
                          <div className="space-y-3">
                            {order.order_items?.map((item: any) => (
                              <div key={item.id} className="flex gap-3 items-center p-3 bg-muted/30 rounded-lg">
                                {item.inventory?.products?.images?.[0] && (
                                  <img 
                                    src={item.inventory.products.images[0]} 
                                    alt={item.inventory?.products?.name || 'Product'} 
                                    className="w-16 h-16 object-cover rounded border"
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {item.inventory?.products?.name || 'Product'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Quantity: {item.qty}
                                  </p>
                                  <p className="text-sm font-semibold mt-1">
                                    ₹{item.unit_price} × {item.qty} = ₹{item.line_total.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div className="border-t pt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>₹{order.subtotal.toFixed(2)}</span>
                          </div>
                          {order.shipping_fee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Shipping Fee</span>
                              <span>₹{order.shipping_fee.toFixed(2)}</span>
                            </div>
                          )}
                          {order.tax > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Tax</span>
                              <span>₹{order.tax.toFixed(2)}</span>
                            </div>
                          )}
                          {order.discount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span>Discount</span>
                              <span>-₹{order.discount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-lg font-bold border-t pt-2">
                            <span>Total</span>
                            <span>₹{order.total.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <Badge variant="outline">{order.payment_status}</Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/order-feedback/${order.id}`);
                              }}
                            >
                              Write Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
