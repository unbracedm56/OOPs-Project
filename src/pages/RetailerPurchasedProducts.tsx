import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RetailerLayout from "@/components/RetailerLayout";

export default function RetailerPurchasedProducts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [store, setStore] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [deliveredOrders, setDeliveredOrders] = useState<any[]>([]);
  const [ownedProducts, setOwnedProducts] = useState<any[]>([]);
  const [purchasedTracking, setPurchasedTracking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .eq("type", "retailer")
        .single();

      if (!storeData) {
        navigate("/dashboard");
        return;
      }

      setStore(storeData);

      // Fetch delivered orders (products purchased from wholesalers)
      const { data: ordersData } = await supabase
        .from("orders")
        .select(`
          *,
          stores:store_id (
            name,
            type
          ),
          order_items (
            *,
            inventory:inventory_id (
              *,
              products:product_id (
                *
              )
            )
          )
        `)
        .eq("customer_id", user.id)
        .eq("status", "delivered")
        .order("created_at", { ascending: false });

      setDeliveredOrders(ordersData || []);

      // Fetch inventory items (owned products)
      const { data: inventoryData } = await supabase
        .from("inventory")
        .select(`
          *,
          products:product_id (*),
          source_order:source_order_id (
            order_number,
            stores:store_id (
              name
            )
          )
        `)
        .eq("store_id", storeData.id);

      setOwnedProducts(inventoryData || []);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToInventory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!store || !selectedProduct) return;

    try {
      const { error } = await supabase
        .from("inventory")
        .insert({
          product_id: selectedProduct.inventory.products.id,
          store_id: store.id,
          price: Number(formData.get("price")),
          mrp: Number(formData.get("mrp")),
          stock_qty: Number(formData.get("stock_qty")),
          delivery_days: Number(formData.get("delivery_days")),
          source_order_id: selectedProduct.order_id,
          source_type: 'purchased',
          is_active: formData.get("is_active") === "on"
        });

      if (error) throw error;

      toast({ 
        title: "Success",
        description: "Product added to your inventory successfully" 
      });
      
      setIsAddDialogOpen(false);
      setSelectedProduct(null);
      fetchData();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const isProductInInventory = (productId: string) => {
    return ownedProducts.some(item => item.product_id === productId);
  };

  const getAvailableQty = (productId: string, orderId: string, purchasedQty: number) => {
    // Calculate how much has already been added to inventory from this order
    const alreadyAdded = ownedProducts
      .filter(item => item.product_id === productId && item.source_order_id === orderId)
      .reduce((sum, item) => sum + item.stock_qty, 0);
    
    return Math.max(0, purchasedQty - alreadyAdded);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <RetailerLayout 
      title="My Products" 
      activePage="products"
      profile={profile}
    >
      <Tabs defaultValue="owned" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="owned">My Inventory ({ownedProducts.length})</TabsTrigger>
          <TabsTrigger value="purchased">Purchased from Wholesalers</TabsTrigger>
        </TabsList>

        {/* My Inventory Tab */}
        <TabsContent value="owned">
          <div className="space-y-4">
              {ownedProducts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No products in inventory yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add products from purchased items or create new ones
                    </p>
                  </CardContent>
                </Card>
              ) : (
                ownedProducts.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {item.products?.images?.[0] && (
                          <img
                            src={item.products.images[0]}
                            alt={item.products.name}
                            className="w-24 h-24 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{item.products?.name}</h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {item.products?.description}
                              </p>
                              <div className="flex gap-2 mb-2">
                                <Badge variant={item.is_active ? "default" : "secondary"}>
                                  {item.is_active ? "Selling" : "Not Selling"}
                                </Badge>
                                <Badge variant="outline">
                                  {item.source_type === 'purchased' ? 'Purchased' : 'Created'}
                                </Badge>
                              </div>
                              {item.source_order && (
                                <p className="text-xs text-muted-foreground">
                                  Purchased from: {item.source_order.stores?.name} (Order #{item.source_order.order_number})
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Selling Price</p>
                              <p className="font-semibold">₹{item.price}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">MRP</p>
                              <p className="font-semibold">₹{item.mrp}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Stock</p>
                              <p className="font-semibold">{item.stock_qty} units</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Delivery</p>
                              <p className="font-semibold">{item.delivery_days} days</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Purchased Products Tab */}
          <TabsContent value="purchased">
            <div className="space-y-6">
              {deliveredOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No delivered orders yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Products you purchase from wholesalers will appear here once delivered
                    </p>
                  </CardContent>
                </Card>
              ) : (
                deliveredOrders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Order #{order.order_number}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            From: {order.stores?.name} | Delivered
                          </p>
                        </div>
                        <Badge>Delivered</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {order.order_items?.map((item: any) => {
                          const availableQty = getAvailableQty(
                            item.inventory?.products?.id,
                            order.id,
                            item.qty
                          );
                          const fullyAdded = availableQty === 0;
                          
                          return (
                            <div key={item.id} className="flex items-center gap-4 p-4 border rounded">
                              {item.inventory?.products?.images?.[0] && (
                                <img
                                  src={item.inventory.products.images[0]}
                                  alt={item.inventory.products.name}
                                  className="w-20 h-20 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <h4 className="font-semibold">{item.inventory?.products?.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Purchased: {item.qty} units | Price: ₹{item.unit_price}
                                </p>
                                {availableQty < item.qty && (
                                  <p className="text-sm text-orange-600">
                                    Available to add: {availableQty} units
                                  </p>
                                )}
                              </div>
                              {fullyAdded ? (
                                <Badge variant="secondary">Fully Added to Inventory</Badge>
                              ) : (
                                <Dialog open={isAddDialogOpen && selectedProduct?.id === item.id} onOpenChange={setIsAddDialogOpen}>
                                  <DialogTrigger asChild>
                                    <Button
                                      onClick={() => setSelectedProduct({ ...item, order_id: order.id, available_qty: availableQty })}
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add to Inventory
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Add to Your Inventory</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleAddToInventory} className="space-y-4">
                                      <div className="p-4 bg-muted rounded">
                                        <p className="font-semibold">{item.inventory?.products?.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                          Purchased: {item.qty} units | Available: {availableQty} units at ₹{item.unit_price} each
                                        </p>
                                      </div>
                                      <div>
                                        <Label htmlFor="price">Your Selling Price (₹) *</Label>
                                        <Input 
                                          id="price" 
                                          name="price" 
                                          type="number" 
                                          step="0.01" 
                                          min="0"
                                          defaultValue={item.unit_price}
                                          required 
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Set the price at which you'll sell to customers
                                        </p>
                                      </div>
                                      <div>
                                        <Label htmlFor="mrp">MRP (₹) *</Label>
                                        <Input 
                                          id="mrp" 
                                          name="mrp" 
                                          type="number" 
                                          step="0.01" 
                                          min="0"
                                          defaultValue={item.inventory?.mrp || item.unit_price * 1.2}
                                          required 
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="stock_qty">Stock Quantity *</Label>
                                        <Input 
                                          id="stock_qty" 
                                          name="stock_qty" 
                                          type="number" 
                                          min="1"
                                          max={availableQty}
                                          defaultValue={availableQty}
                                          required 
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Maximum: {availableQty} units (available from this purchase)
                                        </p>
                                      </div>
                                      <div>
                                        <Label htmlFor="delivery_days">Delivery Days *</Label>
                                        <Input 
                                          id="delivery_days" 
                                          name="delivery_days" 
                                          type="number" 
                                          min="1"
                                          defaultValue={item.inventory?.delivery_days || 3}
                                          required 
                                        />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input 
                                          type="checkbox" 
                                          id="is_active" 
                                          name="is_active" 
                                          defaultChecked 
                                        />
                                        <Label htmlFor="is_active">Active (Start selling immediately)</Label>
                                      </div>
                                      <Button type="submit" className="w-full">
                                        Add to Inventory
                                      </Button>
                                    </form>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
    </RetailerLayout>
  );
}
