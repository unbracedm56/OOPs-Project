import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { ShoppingBag, Store, Package, LogOut, BarChart3, ShoppingCart, ListOrdered, UserCircle } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch profile data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileData) {
        navigate("/auth");
        return;
      }

      // Use the secure get_user_role function instead of relying on profiles table
      const { data: role, error: roleError } = await supabase.rpc('get_user_role', {
        _user_id: user.id
      });

      // If no role found (first-time Google OAuth user), redirect to role selection
      if (roleError || !role) {
        console.log('No role found, redirecting to role selection');
        navigate("/role-selection");
        return;
      }

      setUser(user);
      setProfile({ ...profileData, role }); // Override role with secure role from user_roles table

      // Redirect based on secure role
      if (role === "customer") {
        navigate("/customer-dashboard");
      } else if (role === "retailer") {
        navigate("/retailer-dashboard");
      } else if (role === "wholesaler") {
        navigate("/wholesaler-dashboard");
      }
    } catch (error) {
      console.error("Error checking user:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };


  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const getRoleIcon = () => {
    switch (profile?.role) {
      case "customer":
        return ShoppingBag;
      case "retailer":
        return Store;
      case "wholesaler":
        return Package;
      default:
        return BarChart3;
    }
  };

  const RoleIcon = getRoleIcon();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <RoleIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">
              {profile?.role === "customer" ? "LocalMart" : `${profile?.role.charAt(0).toUpperCase() + profile?.role.slice(1)} Dashboard`}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {profile?.role === "customer" && (
              <>
                <Button variant="ghost" size="icon" onClick={() => navigate("/cart")}>
                  <ShoppingCart className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate("/orders")}>
                  <ListOrdered className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
                  <UserCircle className="h-5 w-5" />
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold">
            Welcome back, {profile?.full_name}!
          </h2>
          <p className="text-muted-foreground">
            Here's what's happening with your {profile?.role} account
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {profile?.role === "customer" && (
            <>
              <Card className="hover:shadow-card transition-shadow">
                <CardHeader>
                  <CardTitle>Browse Products</CardTitle>
                  <CardDescription>
                    Discover products from local stores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={() => navigate("/shop")}>
                    Start Shopping
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-card transition-shadow">
                <CardHeader>
                  <CardTitle>My Orders</CardTitle>
                  <CardDescription>
                    Track your recent purchases
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/orders")}>
                    View Orders
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-card transition-shadow">
                <CardHeader>
                  <CardTitle>Shopping Cart</CardTitle>
                  <CardDescription>
                    Review items in your cart
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/cart")}>
                    View Cart
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {profile?.role === "retailer" && (
            <>
              <Card className="hover:shadow-card transition-shadow">
                <CardHeader>
                  <CardTitle>Manage Inventory</CardTitle>
                  <CardDescription>
                    Add and update your products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={() => navigate("/retailer/inventory")}>
                    View Inventory
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-card transition-shadow">
                <CardHeader>
                  <CardTitle>Store Orders</CardTitle>
                  <CardDescription>
                    Manage customer orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/retailer/orders")}>
                    View Orders
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-card transition-shadow">
                <CardHeader>
                  <CardTitle>Store Settings</CardTitle>
                  <CardDescription>
                    Update your store profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/retailer/settings")}>
                    Manage Store
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {profile?.role === "wholesaler" && (
            <>
              <Card className="hover:shadow-card transition-shadow">
                <CardHeader>
                  <CardTitle>Manage Catalog</CardTitle>
                  <CardDescription>
                    Update your wholesale products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={() => navigate("/wholesaler/catalog")}>
                    View Catalog
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-card transition-shadow">
                <CardHeader>
                  <CardTitle>Retailer Orders</CardTitle>
                  <CardDescription>
                    Manage B2B purchase orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/wholesaler/orders")}>
                    View Orders
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-card transition-shadow">
                <CardHeader>
                  <CardTitle>Pricing Tiers</CardTitle>
                  <CardDescription>
                    Set volume-based pricing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/wholesaler/pricing")}>
                    Manage Pricing
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-8">
          <Card className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Complete your profile to unlock all features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>✓ Account created</p>
                <p className="text-muted-foreground">○ Add profile details</p>
                <p className="text-muted-foreground">○ Set up {profile?.role === "customer" ? "delivery address" : "store location"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
