import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, ShieldCheck, Store, Package, User } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: string;
  created_at: string;
}

const UserManagement = () => {
  const { loading } = useAdminCheck();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get emails from auth.users (need service role for this in production)
      const usersWithEmails = await Promise.all(
        profiles?.map(async (profile) => {
          const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
          return {
            ...profile,
            email: user?.email,
          };
        }) || []
      );

      setUsers(usersWithEmails as UserProfile[]);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // First, get current role from user_roles
      const { data: currentRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (!currentRoles || currentRoles.length === 0) {
        throw new Error("User has no roles");
      }

      // Delete old role
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Insert new role - cast to app_role type
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ 
          user_id: userId, 
          role: newRole as "admin" | "customer" | "retailer" | "wholesaler"
        });

      if (insertError) throw insertError;

      // Also update profiles table (kept for compatibility)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role: newRole as "admin" | "customer" | "retailer" | "wholesaler" })
        .eq("id", userId);

      if (profileError) throw profileError;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user role. Admin privileges required.",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <ShieldCheck className="h-4 w-4" />;
      case "retailer":
        return <Store className="h-4 w-4" />;
      case "wholesaler":
        return <Package className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "retailer":
        return "secondary";
      case "wholesaler":
        return "outline";
      default:
        return "secondary";
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  if (loading || loadingUsers) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
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
              <h1 className="text-xl font-bold">User Management</h1>
            </div>
          </header>

          <main className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  Manage user roles and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="retailer">Retailer</SelectItem>
                      <SelectItem value="wholesaler">Wholesaler</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Current Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell>{user.email || "N/A"}</TableCell>
                          <TableCell>{user.phone || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1">
                              {getRoleIcon(user.role)}
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Select
                              value={user.role}
                              onValueChange={(value) => updateUserRole(user.id, value)}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="retailer">Retailer</SelectItem>
                                <SelectItem value="wholesaler">Wholesaler</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found matching your criteria
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default UserManagement;
