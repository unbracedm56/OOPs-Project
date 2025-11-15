import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, CheckCircle, XCircle, Clock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function WholesalerProxyOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [proxyOrders, setProxyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchProxyOrders();
  }, []);

  const fetchProxyOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get wholesaler's store
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .eq("type", "wholesaler")
        .single();

      if (!store) {
        toast({
          title: "Error",
          description: "Wholesaler store not found",
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
          retailer:retailer_store_id(name, phone),
          customer_order:customer_order_id(order_number)
        `)
        .eq("wholesaler_store_id", store.id)
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

  const handleApprove = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("proxy_orders")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          wholesaler_notes: notes
        })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order approved successfully"
      });

      setSelectedOrder(null);
      setNotes("");
      fetchProxyOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleReject = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("proxy_orders")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
          wholesaler_notes: notes
        })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Order Rejected",
        description: "The order has been rejected"
      });

      setSelectedOrder(null);
      setNotes("");
      fetchProxyOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleMarkAsDelivered = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("proxy_orders")
        .update({
          status: "delivered_to_retailer",
          delivered_to_retailer_at: new Date().toISOString()
        })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order marked as delivered to retailer. Stock has been deducted from your inventory."
      });

      fetchProxyOrders();
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
      pending: { variant: "secondary", icon: Clock, label: "Pending" },
      approved: { variant: "default", icon: CheckCircle, label: "Approved - Awaiting Payment" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rejected" },
      delivered_to_retailer: { variant: "default", icon: Package, label: "Delivered to Retailer" },
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
              <Button variant="ghost" size="icon" onClick={() => navigate("/wholesaler-dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Retailer Orders</h1>
                <p className="text-sm text-muted-foreground">
                  Orders from retailers requesting stock
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {proxyOrders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
              <p className="text-muted-foreground">
                When retailers need additional stock, their orders will appear here
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
                        Customer Order: #{order.customer_order?.order_number}
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
                        <p className="text-sm font-medium mb-1">Retailer</p>
                        <p className="text-sm">{order.retailer?.name}</p>
                        <p className="text-sm text-muted-foreground">{order.retailer?.phone}</p>
                      </div>

                      {order.wholesaler_notes && (
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                          <p className="text-sm font-medium text-amber-900 mb-1">Your Notes</p>
                          <p className="text-sm text-amber-800">{order.wholesaler_notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
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
                        {order.paid_at && (
                          <div>
                            <p className="text-muted-foreground">Paid</p>
                            <p className="font-medium">
                              {new Date(order.paid_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {order.transferred_at && (
                          <div>
                            <p className="text-muted-foreground">Stock Transferred</p>
                            <p className="font-medium">
                              {new Date(order.transferred_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Waiting for payment after approval */}
                      {order.status === 'approved' && order.payment_status !== 'paid' && (
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                          <p className="text-sm text-blue-800">
                            ⏳ Waiting for retailer to make payment
                          </p>
                        </div>
                      )}

                      {/* Ready to deliver after payment */}
                      {order.status === 'approved' && order.payment_status === 'paid' && !order.stock_transferred && (
                        <div className="pt-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button className="w-full" size="lg">
                                <Package className="mr-2 h-4 w-4" />
                                Mark as Delivered to Retailer
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Confirm Delivery to Retailer</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                  By clicking confirm, you acknowledge that you have delivered {order.qty} units to {order.retailer?.name}.
                                </p>
                                <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                                  <p className="text-sm text-amber-800">
                                    <strong>Important:</strong> This will reduce your inventory by {order.qty} units. The retailer can then deliver to the customer.
                                  </p>
                                </div>
                                <Button
                                  className="w-full"
                                  onClick={() => handleMarkAsDelivered(order.id)}
                                >
                                  Confirm Delivery
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}

                      {order.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="default"
                                className="flex-1"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approve Order</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Notes (Optional)</Label>
                                  <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add any notes for the retailer..."
                                    rows={3}
                                  />
                                </div>
                                <div className="bg-green-50 border border-green-200 p-3 rounded-md">
                                  <p className="text-sm text-green-800">
                                    Once approved, the retailer can proceed with payment.
                                  </p>
                                </div>
                                <Button
                                  className="w-full"
                                  onClick={() => handleApprove(order.id)}
                                >
                                  Confirm Approval
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Order</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Reason for Rejection</Label>
                                  <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Please provide a reason for rejection..."
                                    rows={3}
                                  />
                                </div>
                                <Button
                                  variant="destructive"
                                  className="w-full"
                                  onClick={() => handleReject(order.id)}
                                >
                                  Confirm Rejection
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
                            Stock has been transferred
                          </p>
                        </div>
                      )}

                      {order.status === 'approved' && order.payment_status === 'pending' && (
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                          <p className="text-sm text-blue-800">
                            ⏳ Waiting for retailer payment
                          </p>
                        </div>
                      )}
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
}
