import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, FileText, AlertCircle, Home } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";

const AdminDashboard = () => {
  const { loading } = useAdminCheck();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingReviews: 0,
    totalReviews: 0,
    activeStores: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: pendingCount } = await supabase
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .eq("is_published", false);

    const { count: totalReviewsCount } = await supabase
      .from("feedback")
      .select("*", { count: "exact", head: true });

    const { count: storeCount } = await supabase
      .from("stores")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    setStats({
      totalUsers: userCount || 0,
      pendingReviews: pendingCount || 0,
      totalReviews: totalReviewsCount || 0,
      activeStores: storeCount || 0,
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        
        <div className="flex-1">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
              </div>
              <div className="ml-auto">
                <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                  <Home className="h-4 w-4 mr-2" />
                  Back to Site
                </Button>
              </div>
            </div>
          </header>

          <main className="p-6">
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2">Welcome to Admin Panel</h2>
              <p className="text-muted-foreground">
                Manage users, moderate reviews, and monitor system activity
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Registered accounts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingReviews}</div>
                  <p className="text-xs text-muted-foreground">Awaiting moderation</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalReviews}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Stores</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeStores}</div>
                  <p className="text-xs text-muted-foreground">Currently open</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/users")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    View and manage user roles, permissions, and accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Manage Users</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/reviews")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Review Moderation
                  </CardTitle>
                  <CardDescription>
                    Approve or reject product reviews from customers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Moderate Reviews</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/logs")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Audit Logs
                  </CardTitle>
                  <CardDescription>
                    View security events and system activity logs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">View Logs</Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
