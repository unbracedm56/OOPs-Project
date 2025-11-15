import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Package, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PaymentModal from "@/components/PaymentModal";
import LiveLocationAddressForm from "@/components/LiveLocationAddressForm";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartTotal, setCartTotal] = useState({ subtotal: 0, delivery: 5, total: 5 });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [savedPayments, setSavedPayments] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [useNewPayment, setUseNewPayment] = useState(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [useLiveLocation, setUseLiveLocation] = useState(false);

  useEffect(() => {
    fetchAddresses();
    fetchCart();
    fetchSavedPaymentMethods();
    calculateDelivery();
  }, []);

  const fetchAddresses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
      if (data && data.length > 0) {
        setSelectedAddress(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  const fetchCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: cart } = await supabase
        .from("cart")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!cart) return;

      const { data: items, error: itemsError } = await supabase
        .from("cart_items")
        .select(`
          *,
          inventory:inventory_id (
            id,
            price,
            mrp,
            store_id,
            stock_qty,
            delivery_days,
            product_id,
            products (
              id,
              name,
              images
            )
          )
        `)
        .eq("cart_id", cart.id);

      if (itemsError) {
        console.error("Error fetching cart items:", itemsError);
        throw itemsError;
      }

      if (items) {
        setCartItems(items);
        const subtotal = items.reduce((sum, item) => sum + item.inventory.price * item.qty, 0);
        const delivery = items.length > 0 ? 5 : 0;
        setCartTotal({
          subtotal,
          delivery,
          total: subtotal + delivery,
        });
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const fetchSavedPaymentMethods = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("saved_payment_methods")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (data) {
        setSavedPayments(data);
        if (data.length > 0 && !selectedPaymentMethod) {
          setSelectedPaymentMethod(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

  const calculateDelivery = () => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + Math.floor(Math.random() * 3) + 3);
    
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    };
    setEstimatedDelivery(deliveryDate.toLocaleDateString('en-US', options));
  };

  const initiateOrder = () => {
    if (!selectedAddress) {
      toast({
        title: "Error",
        description: "Please select a delivery address",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Error",
        description: "Your cart is empty",
        variant: "destructive",
      });
      return;
    }

    // For COD, process directly
    if (paymentMethod === "cod") {
      processOrder();
    } else {
      // Check if using saved payment or new payment
      // If there are no saved payments, or user chose to use new payment, allow proceeding
      if (savedPayments.length > 0 && !useNewPayment && !selectedPaymentMethod) {
        toast({
          title: "Error",
          description: "Please select a payment method",
          variant: "destructive",
        });
        return;
      }
      setShowPaymentModal(true);
    }
  };

  const processOrder = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Group cart items by store
      const storeGroups = cartItems.reduce((acc: any, item: any) => {
        const storeId = item.inventory.store_id;
        if (!acc[storeId]) {
          acc[storeId] = [];
        }
        acc[storeId].push(item);
        return acc;
      }, {});

      // Create orders for each store
      for (const [storeId, items] of Object.entries(storeGroups)) {
        const storeItems = items as any[];
        const orderTotal = storeItems.reduce(
          (sum, item) => sum + item.inventory.price * item.qty,
          0
        );

        // Create order
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            customer_id: user.id,
            store_id: storeId,
            subtotal: orderTotal,
            shipping_fee: cartTotal.delivery,
            total: orderTotal + cartTotal.delivery,
            delivery_address_id: selectedAddress,
            order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: "pending",
            payment_status: paymentMethod === "cod" ? "cod" : "paid",
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items (split into retailer stock and proxy stock)
        const orderItems = [];
        const proxyOrderData = [];
        
        for (const item of storeItems) {
          const retailerStock = item.inventory.stock_qty;
          
          console.log(`📦 Processing item: ${item.inventory.products.name}`);
          console.log(`   Customer wants: ${item.qty}, Retailer has: ${retailerStock}`);
          
          if (item.qty > retailerStock) {
            console.log(`   ⚠️ PROXY NEEDED: ${item.qty - retailerStock} units short`);
            // Split: retailer stock + proxy stock
            // Add retailer stock portion (normal order item)
            if (retailerStock > 0) {
              orderItems.push({
                order_id: order.id,
                inventory_id: item.inventory_id,
                qty: retailerStock,
                unit_price: item.inventory.price,
                line_total: item.inventory.price * retailerStock,
                from_proxy_order: false,
                product_snapshot: {
                  name: item.inventory.products.name,
                  images: item.inventory.products.images,
                  price: item.inventory.price,
                },
              });
            }
            
            // Store proxy order info to create later
            const neededFromWholesaler = item.qty - retailerStock;
            proxyOrderData.push({
              item,
              neededQty: neededFromWholesaler,
              storeId
            });
            
          } else {
            // Normal order item (all from retailer stock)
            orderItems.push({
              order_id: order.id,
              inventory_id: item.inventory_id,
              qty: item.qty,
              unit_price: item.inventory.price,
              line_total: item.inventory.price * item.qty,
              from_proxy_order: false,
              product_snapshot: {
                name: item.inventory.products.name,
                images: item.inventory.products.images,
                price: item.inventory.price,
              },
            });
          }
        }

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Store proxy order requirements for retailer approval (don't create proxy orders yet)
        if (proxyOrderData.length > 0) {
          const proxyRequirements = [];
          
          for (const proxyData of proxyOrderData) {
            const { item, neededQty, storeId } = proxyData;
            
            // Strategy 1: Try to find the wholesaler from purchase history
            const { data: purchaseHistory } = await supabase
              .from("purchased_product_tracking")
              .select(`
                *,
                source_order:source_order_id(
                  store_id,
                  store:stores!inner(id, name, type)
                )
              `)
              .eq("retailer_store_id", storeId)
              .eq("product_id", item.inventory.product_id)
              .limit(1)
              .maybeSingle();
            
            let wholesalerInv = null;
            
            // If found purchase history, try that wholesaler first
            if (purchaseHistory?.source_order?.store_id) {
              const { data } = await supabase
                .from("inventory")
                .select(`
                  *,
                  product:products!inner(id, name),
                  store:stores!inner(id, name, type)
                `)
                .eq("store_id", purchaseHistory.source_order.store_id)
                .eq("products.name", item.inventory.products.name)
                .eq("is_active", true)
                .gte("stock_qty", neededQty)
                .limit(1)
                .maybeSingle();
              
              wholesalerInv = data;
            }
            
            // Strategy 2: If not found, search any wholesaler with matching product name
            if (!wholesalerInv) {
              const { data } = await supabase
                .from("inventory")
                .select(`
                  *,
                  product:products!inner(id, name),
                  store:stores!inner(id, name, type)
                `)
                .eq("products.name", item.inventory.products.name)
                .eq("stores.type", "wholesaler")
                .eq("is_active", true)
                .gte("stock_qty", neededQty)
                .order("stock_qty", { ascending: false })
                .limit(1)
                .maybeSingle();
              
              wholesalerInv = data;
            }
            
            if (wholesalerInv) {
              const wholesalerDeliveryDays = wholesalerInv.delivery_days || 3;
              const retailerDeliveryDays = item.inventory.delivery_days || 3;
              
              // Store requirement for retailer approval
              proxyRequirements.push({
                product_id: wholesalerInv.product.id,
                product_name: item.inventory.products.name,
                product_image: item.inventory.products.images?.[0] || null,
                inventory_id: wholesalerInv.id,
                wholesaler_store_id: wholesalerInv.store.id,
                wholesaler_name: wholesalerInv.store.name,
                quantity: neededQty,  // Changed from qty to quantity
                qty: neededQty,  // Keep both for compatibility
                unit_price: wholesalerInv.price,
                total: wholesalerInv.price * neededQty,
                wholesaler_delivery_days: wholesalerDeliveryDays,
                retailer_delivery_days: retailerDeliveryDays,
                delivery_days: wholesalerDeliveryDays,  // Add for UI display
                customer_pays: item.inventory.price * neededQty
              });
              
              console.log(`📋 Proxy requirement stored: ${neededQty} units of ${item.inventory.products.name}`);
            } else {
              console.warn(`⚠️ No wholesaler found with ${neededQty} units for ${item.inventory.products.name}`);
            }
          }
          
          // Mark order as needing proxy approval
          if (proxyRequirements.length > 0) {
            console.log(`🔄 Updating order ${order.id} with proxy requirements:`, proxyRequirements);
            
            const { error: updateError } = await supabase
              .from("orders")
              .update({
                needs_proxy_approval: true,
                proxy_order_data: proxyRequirements
              })
              .eq("id", order.id);
            
            if (updateError) {
              console.error("❌ Error updating order with proxy data:", updateError);
              throw updateError;
            }
            
            console.log(`✅ Order ${order.id} marked for retailer proxy approval with ${proxyRequirements.length} items`);
          } else {
            console.log(`ℹ️ No valid wholesalers found, order will not require proxy approval`);
          }
        }

        // Inventory reduction for retailer stock is handled by database trigger
      }

      // Clear cart
      const { data: cart } = await supabase
        .from("cart")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (cart) {
        await supabase
          .from("cart_items")
          .delete()
          .eq("cart_id", cart.id);
      }

      toast({
        title: "Success",
        description: "Order placed successfully!",
      });

      navigate("/order-success");
    } catch (error: any) {
      console.error("Order error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
      navigate("/payment-failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    await processOrder();
  };

  const handlePaymentFailure = () => {
    setShowPaymentModal(false);
    toast({
      title: "Payment Failed",
      description: "Please check your payment details and try again",
      variant: "destructive",
    });
    navigate("/payment-failed");
  };

  const handleLiveLocationSuccess = async (addressId: string) => {
    setSelectedAddress(addressId);
    setUseLiveLocation(false);
    await fetchAddresses();
    toast({
      title: "Success",
      description: "Live location address saved",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="mb-6 text-3xl font-bold">Checkout</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {useLiveLocation ? (
              <LiveLocationAddressForm
                onSuccess={handleLiveLocationSuccess}
                onCancel={() => setUseLiveLocation(false)}
              />
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Delivery Address</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUseLiveLocation(true)}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Use Current Location
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/profile?tab=addresses")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add New
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {addresses.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-4">No saved addresses</p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={() => setUseLiveLocation(true)}>
                          <MapPin className="mr-2 h-4 w-4" />
                          Use Current Location
                        </Button>
                        <Button variant="outline" onClick={() => navigate("/profile?tab=addresses")}>
                          Add Manually
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                      {addresses.map((address) => (
                        <div key={address.id} className="flex items-start space-x-2 rounded-lg border p-4">
                          <RadioGroupItem value={address.id} id={address.id} />
                          <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                            <div className="font-semibold">{address.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {address.line1}{address.line2 && `, ${address.line2}`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {address.city}, {address.state} - {address.pincode}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card">Credit/Debit Card</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bank" id="bank" />
                    <Label htmlFor="bank">Bank Transfer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod">Cash on Delivery</Label>
                  </div>
                </RadioGroup>

                {paymentMethod !== "cod" && (
                  <>
                    <Separator />
                    {savedPayments.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Saved Payment Methods</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/profile?tab=payments")}
                          >
                            Manage
                          </Button>
                        </div>
                        <RadioGroup 
                          value={useNewPayment ? "new" : selectedPaymentMethod} 
                          onValueChange={(value) => {
                            if (value === "new") {
                              setUseNewPayment(true);
                            } else {
                              setUseNewPayment(false);
                              setSelectedPaymentMethod(value);
                            }
                          }}
                        >
                          {savedPayments.map((payment) => (
                            <div key={payment.id} className="flex items-start space-x-2 rounded-lg border p-3">
                              <RadioGroupItem value={payment.id} id={payment.id} />
                              <Label htmlFor={payment.id} className="flex-1 cursor-pointer">
                                <div className="font-medium">{payment.label}</div>
                                <div className="text-sm text-muted-foreground">
                                  {payment.payment_type === "card" ? "Card" : "Bank"} ending in {payment.last_four}
                                </div>
                              </Label>
                            </div>
                          ))}
                          <div className="flex items-center space-x-2 rounded-lg border p-3">
                            <RadioGroupItem value="new" id="new" />
                            <Label htmlFor="new" className="flex items-center gap-2 cursor-pointer">
                              <Plus className="h-4 w-4" />
                              Use a new payment method
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}
                    {savedPayments.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No saved payment methods. You'll be able to save your payment details during checkout.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">₹{cartTotal.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-semibold">₹{cartTotal.delivery.toFixed(2)}</span>
                </div>
                {estimatedDelivery && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Package className="h-4 w-4 text-primary" />
                    <div className="text-sm">
                      <div className="font-medium">Estimated Delivery</div>
                      <div className="text-muted-foreground">{estimatedDelivery}</div>
                    </div>
                  </div>
                )}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{cartTotal.total.toFixed(2)}</span>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={initiateOrder}
                  disabled={loading || addresses.length === 0 || cartItems.length === 0}
                >
                  {loading ? "Processing..." : "Place Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
        paymentMethod={paymentMethod}
        amount={cartTotal.total}
        savedPaymentId={!useNewPayment && selectedPaymentMethod ? selectedPaymentMethod : undefined}
      />
    </div>
  );
};

export default CheckoutPage;
