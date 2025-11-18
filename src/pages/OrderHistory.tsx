import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DeliveryMap } from "@/components/DeliveryMap";
import { AmazonHeader } from "@/components/amazon/AmazonHeader";
import { AmazonFooter } from "@/components/amazon/AmazonFooter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    checkRoleAndFetchData();

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

  const checkRoleAndFetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check user role
      const { data: role } = await supabase.rpc('get_user_role', {
        _user_id: user.id
      });

      setUserRole(role || "customer");
      fetchProfile();
      fetchOrders();
      fetchCounts();
    } catch (error) {
      console.error("Error checking role:", error);
      navigate("/auth");
    }
  };

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(data);
  };

  const fetchCounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count: wishlistCount } = await supabase
      .from("wishlist")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { count: cartCount } = await supabase
      .from("cart")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    setWishlistCount(wishlistCount || 0);
    setCartCount(cartCount || 0);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

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
            type,
            warehouse_address_id
          ),
          delivery_address:delivery_address_id (
            line1,
            line2,
            city,
            state,
            pincode,
            lat,
            lng
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

      // Fetch warehouse addresses for all orders
      const ordersWithWarehouse = await Promise.all(
        (ordersData || []).map(async (order) => {
          if (order.stores?.warehouse_address_id) {
            const { data: warehouseAddress } = await supabase
              .from("addresses")
              .select("lat, lng")
              .eq("id", order.stores.warehouse_address_id)
              .single();
            
            return {
              ...order,
              stores: {
                ...order.stores,
                warehouse_address: warehouseAddress
              }
            };
          }
          return order;
        })
      );

      setOrders(ordersWithWarehouse || []);
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {userRole === "customer" && (
        <AmazonHeader
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          userName={profile?.full_name?.split(" ")[0]}
          onSignOut={handleSignOut}
        />
      )}

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              My Orders
            </h1>
            <p className="text-muted-foreground">Track, manage and view all your orders</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your orders...</p>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="py-16 text-center">
                <div className="mx-auto w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Package className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
                <Button 
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover"
                  onClick={() => navigate("/customer-dashboard")}
                >
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
                  className="transition-all hover:shadow-xl cursor-pointer overflow-hidden border-2 hover:border-primary/50"
                  onClick={() => toggleOrderExpand(order.id)}
                >
                  <CardContent className="p-6">
                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-5 w-5 text-primary" />
                          <p className="font-semibold text-lg">Order #{order.order_number}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Ordered: {new Date(order.placed_at).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Store: <span className="font-medium">{order.stores?.name || 'N/A'}</span> ({order.stores?.type || 'N/A'})
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge 
                          variant={getStatusColor(order.status) as any}
                          className="text-xs font-semibold"
                        >
                          {order.status.toUpperCase()}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                            setMapDialogOpen(true);
                          }}
                          className="gap-1 hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10"
                        >
                          <MapPin className="h-4 w-4" />
                          Track
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6 bg-muted/30 p-4 rounded-lg">
                      <div className="flex justify-between mb-3">
                        {statusSteps.map((step, index) => {
                          const isCompleted = index <= currentStepIndex;
                          const isCurrent = index === currentStepIndex;
                          
                          return (
                            <div key={step.status} className="flex flex-col items-center flex-1">
                              <div 
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${
                                  isCompleted 
                                    ? 'bg-gradient-to-br from-primary to-secondary text-white scale-110 shadow-lg' 
                                    : 'bg-muted text-muted-foreground'
                                } ${isCurrent ? 'ring-4 ring-primary/30 ring-offset-2' : ''}`}
                              >
                                {step.icon}
                              </div>
                              <p className={`text-xs mt-2 text-center font-medium ${
                                isCompleted ? 'text-primary' : 'text-muted-foreground'
                              }`}>
                                {step.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden mt-4">
                        <div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out rounded-full"
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

        {/* Map Dialog */}
        <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Order Delivery Route</DialogTitle>
              <DialogDescription>
                Track the delivery route from warehouse to your location
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold">Order #{selectedOrder.order_number}</p>
                    <p className="text-muted-foreground">Status: {selectedOrder.status}</p>
                  </div>
                  <div>
                    <p className="font-semibold">{selectedOrder.stores?.name}</p>
                    <p className="text-muted-foreground">{selectedOrder.stores?.phone}</p>
                  </div>
                </div>
                {selectedOrder.stores?.warehouse_address?.lat && selectedOrder.stores?.warehouse_address?.lng ? (
                  selectedOrder.delivery_address?.lat && selectedOrder.delivery_address?.lng ? (
                    <DeliveryMap
                      warehouseLocation={{
                        lat: selectedOrder.stores.warehouse_address.lat,
                        lng: selectedOrder.stores.warehouse_address.lng,
                      }}
                      deliveryLocation={{
                        lat: selectedOrder.delivery_address.lat,
                        lng: selectedOrder.delivery_address.lng,
                      }}
                    />
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Delivery address coordinates not available for this order.
                    </p>
                  )
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      The store has not set up their warehouse location yet.
                      Please contact {selectedOrder.stores?.name || "the store"} to set it up.
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </main>

      {userRole === "customer" && <AmazonFooter />}
    </div>
  );
};

export default OrderHistory;
