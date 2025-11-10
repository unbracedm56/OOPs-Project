import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SignOutDialog } from "@/components/SignOutDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { Package, Users, ShoppingCart, TrendingUp, ListOrdered, UserCircle, LogOut } from "lucide-react";
import { WarehouseLocationSetup } from "@/components/WarehouseLocationSetup";

export default function WholesalerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

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
        fetchInventory(storeData.id);
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show warehouse location setup if not configured
  if (store && !store.warehouse_address_id) {
    return <WarehouseLocationSetup storeId={store.id} onComplete={checkUser} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Wholesaler Dashboard</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => navigate("/order-history")}>
                <ListOrdered className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
                <UserCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowSignOutDialog(true)}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Products</p>
                  <p className="text-2xl font-bold">{inventory.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Retailers</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <ShoppingCart className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Orders</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">₹0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Button size="lg" onClick={() => navigate("/wholesaler/inventory")} className="h-20">
            <Package className="mr-2 h-5 w-5" />
            Manage Inventory
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/view-retailers")} className="h-20">
            <Users className="mr-2 h-5 w-5" />
            View Retailers
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/order-history")} className="h-20">
            <ShoppingCart className="mr-2 h-5 w-5" />
            View Orders
          </Button>
        </div>

        {/* Inventory Overview */}
        <div>
          <h2 className="text-xl font-bold mb-4">Inventory Overview</h2>
          <div className="grid grid-cols-1 gap-4">
            {inventory.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {item.products?.images?.[0] && (
                        <img
                          src={item.products.images[0]}
                          alt={item.products.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold">{item.products?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Stock: {item.stock_qty} | Price: ₹{item.price}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => navigate("/wholesaler/inventory")}>
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <SignOutDialog
        open={showSignOutDialog}
        onOpenChange={setShowSignOutDialog}
        onConfirm={handleSignOut}
      />
    </div>
  );
}
