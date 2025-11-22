import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  PackageOpen,
  Users, 
  TrendingUp, 
  ShoppingCart, 
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Clock
} from "lucide-react";
import { WarehouseLocationSetup } from "@/components/WarehouseLocationSetup";
import WholesalerLayout from "@/components/WholesalerLayout";

export default function WholesalerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalRetailers: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
  });
  const [detailedStats, setDetailedStats] = useState({
    pendingOrders: 0,
    todayRevenue: 0,
    processingOrders: 0,
    newRetailersToday: 0,
  });

  useEffect(() => {
    checkUser();
  }, []);

  // Set up real-time subscriptions for orders and inventory
  useEffect(() => {
    if (!store?.id) return;

    // Subscribe to order changes
    const ordersSubscription = supabase
      .channel('wholesaler-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${store.id}`
        },
        () => {
          fetchOrders(store.id);
          calculateStats(store.id);
        }
      )
      .subscribe();

    // Subscribe to inventory changes
    const inventorySubscription = supabase
      .channel('wholesaler-inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `store_id=eq.${store.id}`
        },
        () => {
          fetchInventory(store.id);
          calculateStats(store.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(inventorySubscription);
    };
  }, [store?.id]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData?.role !== "wholesaler") {
        navigate("/dashboard");
        return;
      }

      setUser(user);
      setProfile(profileData);

      // Get or create store
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .eq("type", "wholesaler")
        .single();

      setStore(storeData);
      
      if (storeData) {
        await fetchInventory(storeData.id);
        await fetchOrders(storeData.id);
        await calculateStats(storeData.id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error checking user:", error);
      setLoading(false);
    }
  };

  const fetchInventory = async (storeId: string) => {
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          *,
          products:product_id (*)
        `)
        .eq("store_id", storeId);

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  const fetchOrders = async (storeId: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customer:customer_id (
            full_name,
            email
          )
        `)
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const calculateStats = async (storeId: string) => {
    try {
      // Get all orders for this store
      const { data: allOrders } = await supabase
        .from("orders")
        .select("total, created_at, status")
        .eq("store_id", storeId);

      // Calculate current month stats
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const currentMonthOrders = allOrders?.filter(order => 
        new Date(order.created_at) >= firstDayOfMonth
      ) || [];
      
      const lastMonthOrders = allOrders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= firstDayOfLastMonth && orderDate <= lastDayOfLastMonth;
      }) || [];

      const totalRevenue = currentMonthOrders.reduce((sum, order) => sum + Number(order.total), 0);
      const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + Number(order.total), 0);
      const revenueGrowth = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      const ordersGrowth = lastMonthOrders.length > 0 
        ? ((currentMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100 
        : 0;

      // Get unique retailers count - fetch all orders and count unique customer_ids
      const { data: allStoreOrders } = await supabase
        .from("orders")
        .select("customer_id")
        .eq("store_id", storeId);

      const uniqueRetailers = new Set(allStoreOrders?.map(order => order.customer_id) || []);
      const retailersCount = uniqueRetailers.size;

      // Today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = allOrders?.filter(order => 
        new Date(order.created_at) >= today
      ) || [];

      const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.total), 0);
      const pendingOrders = allOrders?.filter(order => order.status === 'pending').length || 0;
      const processingOrders = allOrders?.filter(order => order.status === 'processing').length || 0;
      
      // Get new retailers today - customers who placed their first order today
      const todayCustomerIds = new Set(todayOrders.map(order => order.customer_id));
      let newRetailersToday = 0;
      
      for (const customerId of todayCustomerIds) {
        const { data: customerOrders } = await supabase
          .from("orders")
          .select("created_at")
          .eq("store_id", storeId)
          .eq("customer_id", customerId)
          .order("created_at", { ascending: true })
          .limit(1);
        
        if (customerOrders && customerOrders.length > 0) {
          const firstOrderDate = new Date(customerOrders[0].created_at);
          if (firstOrderDate >= today) {
            newRetailersToday++;
          }
        }
      }

      setStats({
        totalRevenue,
        totalOrders: currentMonthOrders.length,
        totalProducts: inventory.length,
        totalRetailers: retailersCount,
        revenueGrowth,
        ordersGrowth,
      });

      setDetailedStats({
        pendingOrders,
        todayRevenue,
        processingOrders,
        newRetailersToday,
      });
    } catch (error) {
      console.error("Error calculating stats:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show warehouse location setup if not configured
  if (store && !store.warehouse_address_id) {
    return <WarehouseLocationSetup storeId={store.id} onComplete={checkUser} />;
  }

  return (
    <WholesalerLayout 
      activePage="dashboard" 
      title="Analytics Overview"
      userName={profile?.full_name}
    >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-3xl font-bold">
                      ₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      {stats.revenueGrowth >= 0 ? (
                        <>
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                          <span className="text-green-500 font-medium">+{stats.revenueGrowth.toFixed(1)}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                          <span className="text-red-500 font-medium">{stats.revenueGrowth.toFixed(1)}%</span>
                        </>
                      )}
                      <span className="text-muted-foreground">vs last month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground">Orders</p>
                    <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-orange-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-3xl font-bold">{stats.totalOrders.toLocaleString()}</p>
                    <div className="flex items-center gap-2 text-sm">
                      {stats.ordersGrowth >= 0 ? (
                        <>
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                          <span className="text-green-500 font-medium">+{stats.ordersGrowth.toFixed(1)}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                          <span className="text-red-500 font-medium">{stats.ordersGrowth.toFixed(1)}%</span>
                        </>
                      )}
                      <span className="text-muted-foreground">vs last month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground">Products</p>
                    <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Package className="h-4 w-4 text-blue-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-3xl font-bold">{stats.totalProducts}</p>
                    <p className="text-sm text-muted-foreground">In inventory</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground">Retailers</p>
                    <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-purple-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-3xl font-bold">{stats.totalRetailers}</p>
                    <p className="text-sm text-muted-foreground">Total retailers</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Orders */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent Orders</span>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/order-history")}>
                      View All
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-muted-foreground text-lg mb-6">No orders yet</p>
                      
                      {/* Sales Statistics when no orders */}
                      <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-center mb-2">
                            <Clock className="h-5 w-5 text-blue-500" />
                          </div>
                          <p className="text-2xl font-bold mb-1">{detailedStats.pendingOrders}</p>
                          <p className="text-xs text-muted-foreground">Pending Orders</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-center mb-2">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          </div>
                          <p className="text-2xl font-bold mb-1">₹{detailedStats.todayRevenue.toLocaleString('en-IN')}</p>
                          <p className="text-xs text-muted-foreground">Today's Revenue</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-center mb-2">
                            <Package className="h-5 w-5 text-orange-500" />
                          </div>
                          <p className="text-2xl font-bold mb-1">{detailedStats.processingOrders}</p>
                          <p className="text-xs text-muted-foreground">Processing</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-center mb-2">
                            <Users className="h-5 w-5 text-purple-500" />
                          </div>
                          <p className="text-2xl font-bold mb-1">{detailedStats.newRetailersToday}</p>
                          <p className="text-xs text-muted-foreground">New Retailers Today</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <ShoppingCart className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">Order #{order.id.substring(0, 8)}</p>
                              <p className="text-sm text-muted-foreground">{order.customer?.full_name || "Retailer"}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{Number(order.total).toLocaleString('en-IN')}</p>
                            <div className="flex items-center gap-2 justify-end mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                order.status === 'delivered' ? 'bg-green-500/10 text-green-500' :
                                order.status === 'processing' ? 'bg-blue-500/10 text-blue-500' :
                                order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                'bg-gray-500/10 text-gray-500'
                              }`}>
                                {order.status}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start h-12" 
                    variant="outline"
                    onClick={() => navigate("/wholesaler/inventory")}
                  >
                    <Package className="mr-3 h-5 w-5" />
                    Manage Inventory
                  </Button>
                  <Button 
                    className="w-full justify-start h-12" 
                    variant="outline"
                    onClick={() => navigate("/view-retailers")}
                  >
                    <Users className="mr-3 h-5 w-5" />
                    View Retailers
                  </Button>
                </CardContent>
              </Card>
            </div>
    </WholesalerLayout>
  );
}
