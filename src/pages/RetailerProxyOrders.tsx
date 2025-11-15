import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, CreditCard, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RetailerProxyOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [proxyOrders, setProxyOrders] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchProxyOrders(), fetchPendingApprovals()]);
  };

  const fetchPendingApprovals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get retailer's store
      const { data: store, error: storeError } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .eq("type", "retailer")
        .single();

      if (storeError) {
        console.error("Error fetching retailer store:", storeError);
        return;
      }

      if (!store) {
        console.log("No retailer store found for user");
        return;
      }

      console.log("Fetching pending approvals for store:", store.id);

      // Fetch orders needing proxy approval
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          profile:customer_id (full_name, phone)
        `)
        .eq("store_id", store.id)
        .eq("needs_proxy_approval", true)
        .is("proxy_approved_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching pending orders:", error);
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} pending approval orders:`, data);
      setPendingOrders(data || []);
    } catch (error: any) {
      console.error("Error fetching pending approvals:", error);
    }
  };

  const fetchProxyOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get retailer's store
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .eq("type", "retailer")
        .single();

      if (!store) {
        toast({
          title: "Error",
          description: "Retailer store not found",
          variant: "destructive"
        });
        return;
      }

      // Fetch proxy orders
      const { data, error } = await supabase
        .from("proxy_orders")
        .select(`
          *,
          product:products(name, images),
          wholesaler:wholesaler_store_id(name, phone),
          customer_order:customer_order_id(order_number)
        `)
        .eq("retailer_store_id", store.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setProxyOrders(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndPay = async (orderId: string, proxyData: any[]) => {
    try {
      // Get retailer's store ID and user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive"
        });
        return;
      }

      const { data: store, error: storeError } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .eq("type", "retailer")
        .single();

      if (storeError || !store) {
        toast({
          title: "Error",
          description: "Retailer store not found",
          variant: "destructive"
        });
        return;
      }

      console.log("Creating normal orders to wholesalers for:", proxyData);

      // Group proxy items by wholesaler
      const wholesalerGroups: { [key: string]: any[] } = {};
      proxyData.forEach(proxy => {
        const wholesalerId = proxy.wholesaler_store_id;
        if (!wholesalerGroups[wholesalerId]) {
          wholesalerGroups[wholesalerId] = [];
        }
        wholesalerGroups[wholesalerId].push(proxy);
      });

      // Create a normal order for each wholesaler (just like regular retailer purchases)
      for (const [wholesalerId, items] of Object.entries(wholesalerGroups)) {
        const orderTotal = items.reduce((sum, item) => sum + item.total, 0);
        
        // Create normal order to wholesaler
        const { data: wholesalerOrder, error: orderError } = await supabase
          .from("orders")
          .insert({
            customer_id: user.id, // Retailer is the customer
            store_id: wholesalerId, // Wholesaler's store
            subtotal: orderTotal,
            shipping_fee: 0,
            total: orderTotal,
            order_number: `WS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: "pending",
            payment_status: "paid",
            delivery_address_id: null, // Wholesaler delivers to retailer store, not to address
          })
          .select()
          .single();

        if (orderError) {
          console.error("Error creating wholesaler order:", orderError);
          throw orderError;
        }

        // Create order items for this wholesaler order
        const orderItems = items.map(item => ({
          order_id: wholesalerOrder.id,
          inventory_id: item.inventory_id,
          qty: item.qty || item.quantity,
          unit_price: item.unit_price,
          line_total: item.total,
          from_proxy_order: false,
          product_snapshot: {
            name: item.product_name,
            images: item.product_image ? [item.product_image] : [],
            price: item.unit_price,
          },
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (itemsError) {
          console.error("Error creating order items:", itemsError);
          throw itemsError;
        }

        // Store the wholesaler order ID in proxy_orders table for tracking
        for (const item of items) {
          const { error: proxyError } = await supabase
            .from("proxy_orders")
            .insert({
              retailer_store_id: store.id,
              wholesaler_store_id: wholesalerId,
              product_id: item.product_id,
              inventory_id: item.inventory_id,
              qty: item.qty || item.quantity,
              unit_price: item.unit_price,
              total: item.total,
              customer_order_id: orderId,
              wholesaler_order_id: wholesalerOrder.id, // Link to the normal order
              status: 'approved',
              payment_status: 'paid',
              paid_at: new Date().toISOString(),
              approved_at: new Date().toISOString(),
              wholesaler_delivery_days: item.wholesaler_delivery_days,
              retailer_delivery_days: item.retailer_delivery_days,
            });

          if (proxyError) {
            console.error("Error creating proxy order tracking:", proxyError);
            throw proxyError;
          }
        }
      }

      // Mark customer order as approved
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          proxy_approved_at: new Date().toISOString()
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("Error updating order approval:", updateError);
        throw updateError;
      }

      toast({
        title: "Success",
        description: "Orders placed to wholesalers. They will process and deliver to your store."
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleMarkAsPaid = async (proxyOrderId: string) => {
    try {
      // Payment is now done at approval time, this shouldn't be called
      toast({
        title: "Info",
        description: "Payment is processed during order approval",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      // Cancel the pending approval
      const { error } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
          needs_proxy_approval: false,
          proxy_order_data: null
        })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Order Cancelled",
        description: "The customer order has been cancelled"
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCancelProxyOrder = async (proxyOrderId: string, customerOrderId: string, reason: string) => {
    try {
      // Cancel the proxy order
      const { error: proxyError } = await supabase
        .from("proxy_orders")
        .update({
          status: "cancelled",
          cancelled_by: "retailer",
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason
        })
        .eq("id", proxyOrderId);

      if (proxyError) throw proxyError;

      // Cancel the customer's order as well
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status: "cancelled"
        })
        .eq("id", customerOrderId);

      if (orderError) throw orderError;

      toast({
        title: "Order Cancelled",
        description: "The customer order has been cancelled and the customer will be notified."
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      pending: { variant: "secondary", icon: Clock, label: "Pending Approval" },
      approved: { variant: "default", icon: CheckCircle, label: "Approved" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rejected" },
      completed: { variant: "outline", icon: CheckCircle, label: "Completed" },
      cancelled: { variant: "destructive", icon: XCircle, label: "Cancelled" }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const statusConfig: any = {
      pending: { variant: "secondary", label: "Payment Pending" },
      paid: { variant: "default", label: "Paid" },
      cod: { variant: "outline", label: "COD" },
      failed: { variant: "destructive", label: "Failed" }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/retailer-dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Wholesaler Orders</h1>
                <p className="text-sm text-muted-foreground">
                  Manage customer orders requiring wholesaler stock
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="pending">
              Pending Approvals ({pendingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active Orders ({proxyOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Approvals</h3>
                  <p className="text-muted-foreground">
                    Orders requiring wholesaler stock will appear here for approval
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {pendingOrders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Customer: {order.profile?.full_name || 'Unknown'}
                          </p>
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Needs Approval
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                          <p className="text-sm text-amber-800 font-medium mb-2">
                            ⚠️ This order requires stock from wholesalers
                          </p>
                          <p className="text-xs text-amber-700">
                            Review the wholesaler orders below and approve to proceed with payment
                          </p>
                        </div>

                        {order.proxy_order_data && order.proxy_order_data.map((proxy: any, idx: number) => (
                          <div key={idx} className="bg-muted p-4 rounded-lg space-y-3">
                            <div className="flex items-center gap-4">
                              {proxy.product_image && (
                                <img
                                  src={proxy.product_image}
                                  alt={proxy.product_name}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <h4 className="font-semibold">{proxy.product_name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Quantity needed: {proxy.quantity} units
                                </p>
                                <p className="text-sm font-medium text-primary">
                                  ₹{proxy.unit_price} × {proxy.quantity} = ₹{proxy.total}
                                </p>
                              </div>
                            </div>
                            <div className="bg-background p-2 rounded">
                              <p className="text-sm font-medium">Wholesaler: {proxy.wholesaler_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Delivery: {proxy.delivery_days || 3} days
                              </p>
                            </div>
                          </div>
                        ))}

                        <div className="bg-primary/10 p-3 rounded-lg">
                          <p className="text-sm font-medium">Total Wholesaler Payment Required</p>
                          <p className="text-2xl font-bold text-primary">
                            ₹{order.proxy_order_data?.reduce((sum: number, p: any) => sum + (p.total || 0), 0)}
                          </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button 
                            className="flex-1" 
                            size="lg"
                            onClick={() => handleApproveAndPay(order.id, order.proxy_order_data)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve & Pay
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" size="lg">
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Cancel Order</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                  This will cancel the customer's order. The customer will be notified.
                                </p>
                                <div className="space-y-2">
                                  <Label htmlFor="cancel-reason-pending">Cancellation Reason *</Label>
                                  <Textarea
                                    id="cancel-reason-pending"
                                    placeholder="e.g., Unable to fulfill order, insufficient stock..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="min-h-[100px]"
                                  />
                                </div>
                                <Button
                                  variant="destructive"
                                  className="w-full"
                                  disabled={!cancelReason.trim()}
                                  onClick={() => {
                                    handleCancelOrder(order.id, cancelReason);
                                    setCancelReason("");
                                  }}
                                >
                                  Confirm Cancellation
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            {proxyOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Orders</h3>
                  <p className="text-muted-foreground">
                    Approved orders to wholesalers will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {proxyOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.proxy_order_number}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        For Customer Order: #{order.customer_order?.order_number}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {getStatusBadge(order.status)}
                      {getPaymentBadge(order.payment_status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        {order.product?.images?.[0] && (
                          <img
                            src={order.product.images[0]}
                            alt={order.product.name}
                            className="w-20 h-20 object-cover rounded"
                          />
                        )}
                        <div>
                          <h4 className="font-semibold">{order.product?.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {order.qty} units
                          </p>
                          <p className="text-sm font-medium text-primary">
                            ₹{order.unit_price} × {order.qty} = ₹{order.total}
                          </p>
                        </div>
                      </div>

                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">Wholesaler</p>
                        <p className="text-sm">{order.wholesaler?.name}</p>
                        <p className="text-sm text-muted-foreground">{order.wholesaler?.phone}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-muted p-3 rounded-lg space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Wholesaler Delivery</p>
                            <p className="font-medium">{order.wholesaler_delivery_days || 3} days</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Your Delivery</p>
                            <p className="font-medium">{order.retailer_delivery_days || 3} days</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">Total Delivery Time</p>
                          <p className="font-bold text-primary">
                            {(order.wholesaler_delivery_days || 3) + (order.retailer_delivery_days || 3)} days
                          </p>
                          {order.estimated_delivery_date && (
                            <p className="text-xs text-muted-foreground">
                              Est: {new Date(order.estimated_delivery_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Created</p>
                          <p className="font-medium">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {order.approved_at && (
                          <div>
                            <p className="text-muted-foreground">Approved</p>
                            <p className="font-medium">
                              {new Date(order.approved_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {order.transferred_at && (
                          <div>
                            <p className="text-muted-foreground">Delivered to Customer</p>
                            <p className="font-medium">
                              {new Date(order.transferred_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {order.status === 'pending' && (
                        <div className="pt-2 space-y-2">
                          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                            <p className="text-sm text-blue-800">
                              ⏳ Waiting for wholesaler to process and deliver
                            </p>
                          </div>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="w-full">
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel Order
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Cancel Order</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                  This will cancel both the proxy order and the customer's order. The customer will be notified.
                                </p>
                                <div className="space-y-2">
                                  <Label htmlFor="cancel-reason-active">Cancellation Reason *</Label>
                                  <Textarea
                                    id="cancel-reason-active"
                                    placeholder="e.g., Unable to fulfill order, insufficient stock..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="min-h-[100px]"
                                  />
                                </div>
                                <Button
                                  variant="destructive"
                                  className="w-full"
                                  disabled={!cancelReason.trim()}
                                  onClick={() => {
                                    handleCancelProxyOrder(order.id, order.customer_order_id, cancelReason);
                                    setCancelReason("");
                                  }}
                                >
                                  Confirm Cancellation
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}

                      {order.stock_transferred && (
                        <div className="bg-green-50 border border-green-200 p-3 rounded-md">
                          <p className="text-sm text-green-800 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Stock delivered directly to customer
                          </p>
                        </div>
                      )}
                      
                      {order.status === 'cancelled' && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded-md space-y-1">
                          <p className="text-sm text-red-800 flex items-center gap-2 font-medium">
                            <XCircle className="h-4 w-4" />
                            Order Cancelled
                          </p>
                          {order.cancellation_reason && (
                            <p className="text-xs text-red-700">
                              Reason: {order.cancellation_reason}
                            </p>
                          )}
                          {order.cancelled_at && (
                            <p className="text-xs text-red-600">
                              Cancelled on: {new Date(order.cancelled_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
