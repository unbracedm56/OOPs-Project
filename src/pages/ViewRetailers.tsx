import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, MapPin } from "lucide-react";
import WholesalerLayout from "@/components/WholesalerLayout";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { DeliveryMap } from "@/components/DeliveryMap";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ViewRetailers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [store, setStore] = useState<any>(null);

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
            .channel('wholesaler-orders-changes')
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

      const { data: storeData } = await supabase
        .from("stores")
        .select("id, type, warehouse_address_id")
        .eq("owner_id", user.id)
        .single();

      if (!storeData) return;
      
      // Fetch warehouse address separately
      let warehouseAddress = null;
      if (storeData.warehouse_address_id) {
        const { data: addressData } = await supabase
          .from("addresses")
          .select("lat, lng")
          .eq("id", storeData.warehouse_address_id)
          .single();
        warehouseAddress = addressData;
      }

      setStore({ ...storeData, warehouse_address: warehouseAddress });

      const { data: ordersData, error } = await supabase
        .from("orders")
        .select(`
          *,
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
        .eq("store_id", storeData.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch customer (retailer) details for each order
      const ordersWithCustomerData = await Promise.all(
        (ordersData || []).map(async (order) => {
          // First, try to get the store using customer_id as store ID
          const { data: storeByCustomerId, error: storeByIdError } = await supabase
            .from("stores")
            .select("id, name, phone, owner_id, warehouse_address_id")
            .eq("id", order.customer_id)
            .maybeSingle();

          let customerData = null;
          let storeData = null;

          if (storeByCustomerId) {
            // customer_id is actually a store ID, get the owner's profile
            console.log("customer_id is a store ID:", storeByCustomerId);
            const { data: ownerProfile } = await supabase
              .from("profiles")
              .select("full_name, phone")
              .eq("id", storeByCustomerId.owner_id)
              .maybeSingle();
            
            customerData = ownerProfile;
            storeData = storeByCustomerId;
          } else {
            // customer_id is a user ID, proceed normally
            const { data: profileData } = await supabase
              .from("profiles")
              .select("full_name, phone")
              .eq("id", order.customer_id)
              .maybeSingle();

            customerData = profileData;

            const { data: storeByOwnerId } = await supabase
              .from("stores")
              .select("id, name, phone, warehouse_address_id")
              .eq("owner_id", order.customer_id)
              .maybeSingle();

            storeData = storeByOwnerId;
          }

          let warehouseAddress = null;
          if (storeData?.warehouse_address_id) {
            const { data: addressData } = await supabase
              .from("addresses")
              .select("line1, line2, city, state, pincode, lat, lng")
              .eq("id", storeData.warehouse_address_id)
              .maybeSingle();
            
            warehouseAddress = addressData;
          }

          console.log(`Order ${order.order_number}:`, {
            customer_id: order.customer_id,
            customerData,
            storeData,
            warehouseAddress
          });

          return {
            ...order,
            customer: customerData,
            customer_store: {
              ...storeData,
              addresses: warehouseAddress
            }
          };
        })
      );

      console.log("Orders data:", ordersWithCustomerData);
      console.log("First order sample:", ordersWithCustomerData?.[0]);
      setOrders(ordersWithCustomerData || []);
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
    <WholesalerLayout activePage="retailers" title="Retailer Orders">

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
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
                        Retailer: {order.customer?.full_name || order.customer_store?.name || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Phone: {order.customer?.phone || order.customer_store?.phone || 'N/A'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setMapDialogOpen(true);
                        }}
                        className="gap-2"
                      >
                        <MapPin className="h-4 w-4" />
                        View Route
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold mb-1">Warehouse Address:</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customer_store?.addresses?.line1 || 'N/A'}
                        {order.customer_store?.addresses?.line2 && `, ${order.customer_store.addresses.line2}`}
                        {order.customer_store?.addresses?.city && `, ${order.customer_store.addresses.city}`}
                        {order.customer_store?.addresses?.state && `, ${order.customer_store.addresses.state}`}
                        {order.customer_store?.addresses?.pincode && ` - ${order.customer_store.addresses.pincode}`}
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

      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Delivery Route</DialogTitle>
            <DialogDescription>
              Route from your warehouse to the retailer's warehouse address
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="mt-4">
              {store?.warehouse_address?.lat && store?.warehouse_address?.lng ? (
                selectedOrder.customer_store?.addresses?.lat && 
                selectedOrder.customer_store?.addresses?.lng ? (
                  <DeliveryMap
                    warehouseLocation={{
                      lat: store.warehouse_address.lat,
                      lng: store.warehouse_address.lng,
                    }}
                    deliveryLocation={{
                      lat: selectedOrder.customer_store.addresses.lat,
                      lng: selectedOrder.customer_store.addresses.lng,
                    }}
                  />
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Retailer warehouse location coordinates not available for this order.
                  </p>
                )
              ) : (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">
                    Your warehouse location is not set.
                  </p>
                  <Button 
                    onClick={() => {
                      setMapDialogOpen(false);
                      navigate("/wholesaler-dashboard");
                    }}
                    variant="default"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Set Warehouse Location
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Go to your dashboard to set up your warehouse location.
                    The page will automatically prompt you to set it up.
                  </p>
                </div>
              )}
            </div>
          )}  
        </DialogContent>
      </Dialog>
    </WholesalerLayout>
  );
};

export default ViewRetailers;
