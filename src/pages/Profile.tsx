import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, MapPin, CreditCard, Upload, Camera } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Get tab from URL params
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const defaultTab = searchParams.get("tab") || "profile";

  useEffect(() => {
    fetchProfile();
    fetchAddresses();
    fetchPaymentMethods();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Store user email
      setUserEmail(user.email || "");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
      }

      console.log("Profile loaded:", data);
      setProfile(data);
      setLoading(false);
    } catch (error) {
      console.error("Profile fetch error:", error);
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });

    setAddresses(data || []);
  };

  const fetchPaymentMethods = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("saved_payment_methods")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });

    setPaymentMethods(data || []);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !profile?.id) return;

    setUploadingAvatar(true);
    try {
      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        await supabase.storage.from('avatars').remove([`${profile.id}/${oldPath}`]);
      }

      // Upload new avatar
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
      
      setAvatarFile(null);
      setAvatarPreview("");
      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.get("full_name") as string,
        phone: formData.get("phone") as string,
      })
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      fetchProfile();
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("new_password") as string;
    const confirmPassword = formData.get("confirm_password") as string;

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      e.currentTarget.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "Profile not loaded. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData(e.currentTarget);

    console.log("Saving address - profile:", profile);
    console.log("Form data:", Object.fromEntries(formData.entries()));

    const addressData = {
      user_id: profile.id,
      label: formData.get("label") as string || "Address",
      line1: formData.get("line1") as string,
      line2: formData.get("line2") as string || null,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      pincode: formData.get("pincode") as string,
      country: (formData.get("country") as string) || "India",
      is_default: formData.get("is_default") === "on",
    };

    console.log("Address data to save:", addressData);

    let error;
    if (editingAddress?.id) {
      console.log("Updating address:", editingAddress.id);
      ({ error } = await supabase
        .from("addresses")
        .update(addressData)
        .eq("id", editingAddress.id));
    } else {
      console.log("Inserting new address");
      const result = await supabase
        .from("addresses")
        .insert(addressData)
        .select();
      
      error = result.error;
      console.log("Insert result:", result);
    }

    if (error) {
      console.error("Address save error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: editingAddress?.id ? "Address updated" : "Address added",
      });
      setEditingAddress(null);
      fetchAddresses();
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Address deleted",
      });
      fetchAddresses();
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    // First, unset all defaults
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", profile.id);

    // Then set the new default
    const { error } = await supabase
      .from("addresses")
      .update({ is_default: true })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Default address updated",
      });
      fetchAddresses();
    }
  };

  const handleSavePaymentMethod = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const paymentData = {
      user_id: profile.id,
      payment_type: formData.get("payment_type") as string,
      label: formData.get("label") as string,
      last_four: formData.get("last_four") as string,
      card_name: formData.get("card_name") as string || null,
      expiry_date: formData.get("expiry_date") as string || null,
      account_number: formData.get("account_number") as string || null,
      ifsc_code: formData.get("ifsc_code") as string || null,
      is_default: formData.get("is_default") === "on",
    };

    let error;
    if (editingPayment?.id) {
      ({ error } = await supabase
        .from("saved_payment_methods")
        .update(paymentData)
        .eq("id", editingPayment.id));
    } else {
      ({ error } = await supabase
        .from("saved_payment_methods")
        .insert(paymentData));
    }

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: editingPayment?.id ? "Payment method updated" : "Payment method added",
      });
      setEditingPayment(null);
      fetchPaymentMethods();
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    const { error } = await supabase
      .from("saved_payment_methods")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Payment method deleted",
      });
      fetchPaymentMethods();
    }
  };

  const handleSetDefaultPaymentMethod = async (id: string) => {
    // First, unset all defaults
    await supabase
      .from("saved_payment_methods")
      .update({ is_default: false })
      .eq("user_id", profile.id);

    // Then set the new default
    const { error } = await supabase
      .from("saved_payment_methods")
      .update({ is_default: true })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Default payment method updated",
      });
      fetchPaymentMethods();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Profile & Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="payments">Payment Methods</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>Update your avatar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview || profile?.avatar_url} alt={profile?.full_name} />
                    <AvatarFallback className="text-2xl">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('avatar')?.click()}
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Choose Photo
                      </Button>
                      {avatarFile && (
                        <Button
                          type="button"
                          onClick={handleAvatarUpload}
                          disabled={uploadingAvatar}
                          className="bg-gradient-to-r from-primary to-primary-glow"
                        >
                          {uploadingAvatar ? (
                            <>Uploading...</>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG or GIF (max. 5MB)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your profile details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={userEmail} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      defaultValue={profile?.full_name}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={profile?.phone}
                    />
                  </div>

                  <Button type="submit" className="bg-gradient-to-r from-primary to-primary-glow">
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      name="new_password"
                      type="password"
                      placeholder="Enter new password"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password</Label>
                    <Input
                      id="confirm_password"
                      name="confirm_password"
                      type="password"
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={changingPassword}
                    className="bg-gradient-to-r from-primary to-primary-glow"
                  >
                    {changingPassword ? "Changing..." : "Change Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Delivery Addresses</h3>
              <Button
                onClick={() => setEditingAddress({})}
                className="bg-gradient-to-r from-primary to-primary-glow"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Address
              </Button>
            </div>

            {editingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingAddress.id ? "Edit Address" : "New Address"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveAddress} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="label">Label (Home, Work, etc.)</Label>
                      <Input
                        id="label"
                        name="label"
                        defaultValue={editingAddress.label}
                        placeholder="Home"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="line1">Address Line 1</Label>
                      <Input
                        id="line1"
                        name="line1"
                        defaultValue={editingAddress.line1}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="line2">Address Line 2</Label>
                      <Input
                        id="line2"
                        name="line2"
                        defaultValue={editingAddress.line2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          defaultValue={editingAddress.city}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          name="state"
                          defaultValue={editingAddress.state}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input
                          id="pincode"
                          name="pincode"
                          defaultValue={editingAddress.pincode}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          name="country"
                          defaultValue={editingAddress.country || "India"}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_default"
                        name="is_default"
                        defaultChecked={editingAddress.is_default}
                        className="rounded"
                      />
                      <Label htmlFor="is_default" className="cursor-pointer">
                        Set as default address
                      </Label>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" className="bg-gradient-to-r from-primary to-primary-glow">
                        Save Address
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingAddress(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              {addresses.map((address) => (
                <Card key={address.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          {address.label && (
                            <span className="font-semibold">{address.label}</span>
                          )}
                          {address.is_default && (
                            <Badge variant="default">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm">
                          {address.line1}
                          {address.line2 && `, ${address.line2}`}
                        </p>
                        <p className="text-sm">
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                        <p className="text-sm text-muted-foreground">{address.country}</p>
                      </div>
                      <div className="flex gap-2">
                        {!address.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefaultAddress(address.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingAddress(address)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAddress(address.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {addresses.length === 0 && !editingAddress && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No addresses saved yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Saved Payment Methods</h3>
              <Button
                onClick={() => setEditingPayment({})}
                className="bg-gradient-to-r from-primary to-primary-glow"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </div>

            {editingPayment && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingPayment.id ? "Edit Payment Method" : "New Payment Method"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSavePaymentMethod} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="payment_type">Payment Type</Label>
                      <select
                        id="payment_type"
                        name="payment_type"
                        defaultValue={editingPayment.payment_type || "card"}
                        required
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                      >
                        <option value="card">Credit/Debit Card</option>
                        <option value="bank">Bank Account</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="label">Label (e.g., "My Visa Card")</Label>
                      <Input
                        id="label"
                        name="label"
                        defaultValue={editingPayment.label}
                        placeholder="My Primary Card"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="card_name">Cardholder Name / Account Holder Name</Label>
                      <Input
                        id="card_name"
                        name="card_name"
                        defaultValue={editingPayment.card_name}
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="last_four">Last 4 Digits</Label>
                        <Input
                          id="last_four"
                          name="last_four"
                          defaultValue={editingPayment.last_four}
                          placeholder="1234"
                          maxLength={4}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="expiry_date">Expiry (MM/YY) - Cards only</Label>
                        <Input
                          id="expiry_date"
                          name="expiry_date"
                          defaultValue={editingPayment.expiry_date}
                          placeholder="12/25"
                          maxLength={5}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ifsc_code">IFSC Code (Bank only)</Label>
                      <Input
                        id="ifsc_code"
                        name="ifsc_code"
                        defaultValue={editingPayment.ifsc_code}
                        placeholder="SBIN0001234"
                        maxLength={11}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_default"
                        name="is_default"
                        defaultChecked={editingPayment.is_default}
                        className="rounded"
                      />
                      <Label htmlFor="is_default" className="cursor-pointer">
                        Set as default payment method
                      </Label>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" className="bg-gradient-to-r from-primary to-primary-glow">
                        Save Payment Method
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingPayment(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              {paymentMethods.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {payment.payment_type === "card" ? (
                            <div className="p-2 rounded-lg bg-primary/10">
                              <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-primary/10">
                              <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                          )}
                          <span className="font-semibold">{payment.label}</span>
                          {payment.is_default && (
                            <Badge variant="default">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm">
                          {payment.payment_type === "card" ? "Card" : "Bank Account"} ending in •••• {payment.last_four}
                        </p>
                        {payment.card_name && (
                          <p className="text-sm text-muted-foreground">{payment.card_name}</p>
                        )}
                        {payment.expiry_date && (
                          <p className="text-sm text-muted-foreground">Expires {payment.expiry_date}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!payment.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefaultPaymentMethod(payment.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingPayment(payment)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePaymentMethod(payment.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {paymentMethods.length === 0 && !editingPayment && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No payment methods saved yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
