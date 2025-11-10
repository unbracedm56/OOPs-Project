import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Store, Package } from "lucide-react";

const RoleSelection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<"customer" | "retailer" | "wholesaler" | null>(null);
  const [loading, setLoading] = useState(false);

  const roleOptions = [
    {
      value: "customer" as const,
      label: "Customer",
      icon: ShoppingBag,
      description: "Shop from local stores",
    },
    {
      value: "retailer" as const,
      label: "Retailer",
      icon: Store,
      description: "Manage your store",
    },
    {
      value: "wholesaler" as const,
      label: "Wholesaler",
      icon: Package,
      description: "Supply to retailers",
    },
  ];

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      toast({
        title: "Please select a role",
        description: "Choose how you want to use the platform",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Update profile with role
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role: selectedRole })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Insert into user_roles
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: selectedRole });

      if (roleError) throw roleError;

      // Create store for retailer/wholesaler
      if (selectedRole === "retailer" || selectedRole === "wholesaler") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        const { error: storeError } = await supabase
          .from("stores")
          .insert({
            owner_id: user.id,
            name: `${profile?.full_name || "User"}'s Store`,
            type: selectedRole,
            is_active: true,
          });

        if (storeError) throw storeError;
      }

      toast({
        title: "Role set successfully!",
        description: "Redirecting to your dashboard...",
      });

      // Redirect based on role
      setTimeout(() => {
        if (selectedRole === "customer") {
          navigate("/customer-dashboard");
        } else if (selectedRole === "retailer") {
          navigate("/retailer-dashboard");
        } else if (selectedRole === "wholesaler") {
          navigate("/wholesaler-dashboard");
        }
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-2xl shadow-elegant">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Choose Your Role</CardTitle>
          <CardDescription>
            Select how you want to use the platform. You can change this later.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {roleOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedRole === option.value;
              return (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-all hover:shadow-card ${
                    isSelected ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setSelectedRole(option.value)}
                >
                  <CardContent className="flex flex-col items-center gap-3 p-6">
                    <div className={`rounded-full p-4 ${
                      isSelected ? "bg-primary/10" : "bg-muted"
                    }`}>
                      <Icon className={`h-8 w-8 ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }`} />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold">{option.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button
            className="mt-6 w-full bg-gradient-to-r from-primary to-primary-glow"
            onClick={handleRoleSelection}
            disabled={!selectedRole || loading}
          >
            {loading ? "Setting up..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleSelection;
