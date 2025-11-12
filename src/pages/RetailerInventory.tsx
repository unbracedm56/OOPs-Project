import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RetailerInventory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<any[]>([]);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [imageUrls, setImageUrls] = useState<string>("");

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .eq("type", "retailer")
        .maybeSingle();

      setStore(storeData);

      if (storeData) {
        const { data: inventoryData } = await supabase
          .from("inventory")
          .select(`
            *,
            products:product_id (*)
          `)
          .eq("store_id", storeData.id);

        setInventory(inventoryData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!store) {
      toast({ title: "Error", description: "Store not found", variant: "destructive" });
      return;
    }

    try {
      // Create slug from product name
      const productName = formData.get("product_name") as string;
      const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substr(2, 6);
      
      // Parse image URLs (comma-separated)
      const imageUrlArray = imageUrls.split(',').map(url => url.trim()).filter(url => url);
      
      // First create the product
      const { data: newProduct, error: productError } = await supabase
        .from("products")
        .insert({
          name: productName,
          slug: slug,
          description: formData.get("description") as string,
          brand: formData.get("brand") as string,
          category_id: selectedCategoryId || null,
          images: imageUrlArray,
          sku: formData.get("sku") as string || null,
          created_by_store_id: store.id
        })
        .select()
        .single();

      if (productError) throw productError;

      // Then add to inventory
      const { error: inventoryError } = await supabase
        .from("inventory")
        .insert({
          product_id: newProduct.id,
          store_id: store.id,
          price: Number(formData.get("price")),
          mrp: Number(formData.get("mrp")),
          retail_price: Number(formData.get("mrp")),
          stock_qty: Number(formData.get("stock_qty")),
          delivery_days: Number(formData.get("delivery_days")),
          source_type: 'created',
          is_active: formData.get("is_active") === "on"
        });

      if (inventoryError) throw inventoryError;

      toast({ title: "Product created and added to inventory successfully" });
      setIsAddDialogOpen(false);
      setSelectedCategoryId("");
      setImageUrls("");
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      if (editingItem) {
        const { error } = await supabase
          .from("inventory")
          .update({
            price: Number(formData.get("price")),
            mrp: Number(formData.get("mrp")),
            stock_qty: Number(formData.get("stock_qty")),
            delivery_days: Number(formData.get("delivery_days")),
            is_active: formData.get("is_active") === "on"
          })
          .eq("id", editingItem.id);

        if (error) throw error;
        toast({ title: "Inventory updated successfully" });
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const { error } = await supabase
        .from("inventory")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Item deleted successfully" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">Manage Inventory</h1>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Product to Inventory</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <Label htmlFor="product_name">Product Name *</Label>
                    <Input id="product_name" name="product_name" required />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" name="description" />
                  </div>
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input id="brand" name="brand" />
                  </div>
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input id="sku" name="sku" placeholder="Product SKU (optional)" />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="images">Image URLs (comma-separated)</Label>
                    <Input 
                      id="images" 
                      value={imageUrls}
                      onChange={(e) => setImageUrls(e.target.value)}
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="add_price">Selling Price (₹) *</Label>
                    <Input id="add_price" name="price" type="number" step="0.01" min="0" required />
                  </div>
                  <div>
                    <Label htmlFor="add_mrp">MRP (₹) *</Label>
                    <Input id="add_mrp" name="mrp" type="number" step="0.01" min="0" required />
                  </div>
                  <div>
                    <Label htmlFor="add_stock_qty">Stock Quantity *</Label>
                    <Input id="add_stock_qty" name="stock_qty" type="number" min="0" required />
                  </div>
                  <div>
                    <Label htmlFor="add_delivery_days">Delivery Days *</Label>
                    <Input id="add_delivery_days" name="delivery_days" type="number" min="1" defaultValue="3" required />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="add_is_active" name="is_active" defaultChecked />
                    <Label htmlFor="add_is_active">Active</Label>
                  </div>
                  <Button type="submit" className="w-full">Create Product & Add to Inventory</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6">
          {inventory.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {item.products?.images?.[0] && (
                      <img
                        src={item.products.images[0]}
                        alt={item.products.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{item.products?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Price: ₹{item.price} | MRP: ₹{item.mrp}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Stock: {item.stock_qty} | Delivery: {item.delivery_days} days
                      </p>
                      <p className="text-sm">
                        Status: {item.is_active ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={isDialogOpen && editingItem?.id === item.id} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => setEditingItem(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Inventory Item</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4">
                          <div>
                            <Label htmlFor="price">Selling Price (₹)</Label>
                            <Input id="price" name="price" type="number" step="0.01" defaultValue={item.price} required />
                          </div>
                          <div>
                            <Label htmlFor="mrp">MRP (₹)</Label>
                            <Input id="mrp" name="mrp" type="number" step="0.01" defaultValue={item.mrp} required />
                          </div>
                          <div>
                            <Label htmlFor="stock_qty">Stock Quantity</Label>
                            <Input id="stock_qty" name="stock_qty" type="number" defaultValue={item.stock_qty} required />
                          </div>
                          <div>
                            <Label htmlFor="delivery_days">Delivery Days</Label>
                            <Input id="delivery_days" name="delivery_days" type="number" defaultValue={item.delivery_days} required />
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="is_active" name="is_active" defaultChecked={item.is_active} />
                            <Label htmlFor="is_active">Active</Label>
                          </div>
                          <Button type="submit" className="w-full">Save Changes</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Button variant="destructive" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
