import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SavedAddresses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("addresses").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Address deleted",
      });

      fetchAddresses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);

      const { error } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Default address updated",
      });

      fetchAddresses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/profile")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Saved Addresses</h1>
          <Button onClick={() => navigate("/add-address")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Address
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : addresses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No saved addresses</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <Card key={address.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="font-semibold">{address.label}</h3>
                        {address.is_default && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {address.street}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.city}, {address.state} {address.zipCode}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.country}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Phone: {address.phone}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!address.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(address.id)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(address.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
};

export default SavedAddresses;
