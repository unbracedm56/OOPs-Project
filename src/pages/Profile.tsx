import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import RetailerLayout from "@/components/RetailerLayout";
import WholesalerLayout from "@/components/WholesalerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  User, 
  MapPin,
  ChevronRight,
  Plus,
  Trash2,
  Shield,
  Bell,
  Globe,
  HelpCircle,
  MessageCircle,
  Lock,
  Heart
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AmazonHeader } from "@/components/amazon/AmazonHeader";
import { AmazonFooter } from "@/components/amazon/AmazonFooter";

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [showRetailerLayout, setShowRetailerLayout] = useState(false);
  const [showWholesalerLayout, setShowWholesalerLayout] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("male");
  const [phone, setPhone] = useState("");
  const [activeSection, setActiveSection] = useState("profile");
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [language, setLanguage] = useState("en");
  const [currency, setCurrency] = useState("INR");
  const [timezone, setTimezone] = useState("IST");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    // Check for section parameter in URL
    const section = searchParams.get("section");
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);

  useEffect(() => {
    checkRoleAndFetchData();
  }, []);

  const checkRoleAndFetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check user role
      const { data: role } = await supabase.rpc('get_user_role', {
        _user_id: user.id
      });

      setUserRole(role || "customer");
      
      // Check if coming from retailer dashboard
      const fromRetailerDashboard = document.referrer.includes('/retailer-dashboard') || 
                                     location.state?.from === 'retailer-dashboard';
      setShowRetailerLayout(role === "retailer" && fromRetailerDashboard);
      
      // Check if coming from wholesaler dashboard
      const fromWholesalerDashboard = document.referrer.includes('/wholesaler-dashboard') || 
                                       location.state?.from === 'wholesaler-dashboard';
      setShowWholesalerLayout(role === "wholesaler" && fromWholesalerDashboard);
      
      fetchProfile();
      fetchAddresses();
    } catch (error) {
      console.error("Error checking role:", error);
      navigate("/auth");
    }
  };

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
      
      // Parse full name into first and last name
      if (data?.full_name) {
        const nameParts = data.full_name.split(" ");
        setFirstName(nameParts[0] || "");
        setLastName(nameParts.slice(1).join(" ") || "");
      }
      
      if (data?.phone) {
        setPhone(data.phone);
      }
      
      if (data?.gender) {
        setGender(data.gender);
      }

      // Load language preferences
      if (data?.language) setLanguage(data.language);
      if (data?.currency) setCurrency(data.currency);
      if (data?.timezone) setTimezone(data.timezone);
      if (data?.email_notifications !== undefined) setEmailNotifications(data.email_notifications);
      if (data?.sms_notifications !== undefined) setSmsNotifications(data.sms_notifications);
      
      setLoading(false);
    } catch (error) {
      console.error("Profile fetch error:", error);
      setLoading(false);
    }
  };

  const fetchWishlistCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count } = await supabase
      .from("wishlist")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    setWishlistCount(count || 0);
  };

  const fetchCartCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: cart } = await supabase
      .from("cart")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!cart) {
      setCartCount(0);
      return;
    }

    const { data: items } = await supabase
      .from("cart_items")
      .select("qty")
      .eq("cart_id", cart.id);

    const totalQty = items?.reduce((sum, item) => sum + item.qty, 0) || 0;
    setCartCount(totalQty);
  };

  useEffect(() => {
    if (profile) {
      fetchWishlistCount();
      fetchCartCount();
    }
  }, [profile]);

  const fetchAddresses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  const handleDeleteAddress = async (id: string) => {
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

  const handleSetDefaultAddress = async (id: string) => {
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

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fullName = `${firstName} ${lastName}`.trim();

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone,
      })
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile updated successfully",
      });
      fetchProfile();
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`; // Changed to match RLS policy

      // Upload image to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully",
      });

      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error uploading image",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
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

  const sidebarItems = [
    { id: "orders", label: "MY ORDERS", icon: Package },
    { id: "profile", label: "Profile Information", icon: User, parent: "ACCOUNT SETTINGS" },
    { id: "addresses", label: "Manage Addresses", icon: MapPin, parent: "ACCOUNT SETTINGS" },
    { id: "security", label: "Security Settings", icon: Shield, parent: "SECURITY" },
    { id: "password", label: "Change Password", icon: Lock, parent: "SECURITY" },
    { id: "notifications", label: "Notification Preferences", icon: Bell, parent: "PREFERENCES" },
    { id: "language", label: "Language & Region", icon: Globe, parent: "PREFERENCES" },
    { id: "wishlist-page", label: "My Wishlist", icon: Heart, parent: "MY ACTIVITIES" },
    { id: "help", label: "Help Center", icon: HelpCircle, parent: "SUPPORT" },
    { id: "contact", label: "Contact Us", icon: MessageCircle, parent: "SUPPORT" },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Main profile content (reusable for both layouts)
  const renderProfileContent = () => (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar */}
      <div className="lg:col-span-1">
        <Card className="overflow-hidden border-2">
          {/* Enhanced User Info Header */}
          <div className="relative">
            {/* Gradient Background */}
            <div className="h-32 bg-gradient-to-br from-primary via-secondary to-accent relative overflow-hidden">
              <div className="absolute inset-0 bg-black/5" />
            </div>
                  
                  {/* Profile Info */}
                  <div className="px-6 pb-6 -mt-16">
                    <div className="relative mb-4">
                      <div className="relative inline-block">
                        <Avatar className="h-28 w-28 border-4 border-background shadow-2xl ring-2 ring-primary/20">
                          <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-3xl font-bold">
                            {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Upload Button Overlay */}
                        <label
                          htmlFor="avatar-upload"
                          className="absolute bottom-1 right-1 bg-primary hover:bg-primary/90 text-white rounded-full p-2.5 cursor-pointer shadow-lg transition-all hover:scale-110 hover:shadow-xl border-2 border-background"
                          title="Change profile picture"
                        >
                          <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                            disabled={uploadingAvatar}
                          />
                          {uploadingAvatar ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </label>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold text-foreground">
                        {profile?.full_name || "User"}
                      </h2>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {userEmail}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t" />

                {/* Navigation */}
                <div className="divide-y">
                  {/* Orders - Hide only for wholesalers */}
                  {userRole !== "wholesaler" && (
                  <div
                    className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      activeSection === "orders" ? "bg-muted" : ""
                    }`}
                    onClick={() => {
                      setActiveSection("orders");
                      navigate("/orders");
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-primary" />
                      <span className="font-medium text-sm">MY ORDERS</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  )}

                  {/* Account Settings */}
                  <div>
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-sm text-muted-foreground">ACCOUNT SETTINGS</span>
                      </div>
                      <div className="ml-8 space-y-1">
                        <div
                          className={`py-2 px-3 -mx-3 cursor-pointer hover:bg-muted/50 rounded transition-colors ${
                            activeSection === "profile" ? "text-primary font-medium" : "text-foreground"
                          }`}
                          onClick={() => setActiveSection("profile")}
                        >
                          Profile Information
                        </div>
                        <div
                          className={`py-2 px-3 -mx-3 cursor-pointer hover:bg-muted/50 rounded transition-colors ${
                            activeSection === "addresses" ? "text-primary font-medium" : "text-foreground"
                          }`}
                          onClick={() => setActiveSection("addresses")}
                        >
                          Manage Addresses
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security */}
                  <div>
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-sm text-muted-foreground">SECURITY</span>
                      </div>
                      <div className="ml-8 space-y-1">
                        <div
                          className={`py-2 px-3 -mx-3 cursor-pointer hover:bg-muted/50 rounded transition-colors ${
                            activeSection === "security" ? "text-primary font-medium" : "text-foreground"
                          }`}
                          onClick={() => setActiveSection("security")}
                        >
                          Security Settings
                        </div>
                        <div
                          className={`py-2 px-3 -mx-3 cursor-pointer hover:bg-muted/50 rounded transition-colors ${
                            activeSection === "password" ? "text-primary font-medium" : "text-foreground"
                          }`}
                          onClick={() => setActiveSection("password")}
                        >
                          Change Password
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div>
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-sm text-muted-foreground">PREFERENCES</span>
                      </div>
                      <div className="ml-8 space-y-1">
                        <div
                          className={`py-2 px-3 -mx-3 cursor-pointer hover:bg-muted/50 rounded transition-colors ${
                            activeSection === "notifications" ? "text-primary font-medium" : "text-foreground"
                          }`}
                          onClick={() => setActiveSection("notifications")}
                        >
                          Notification Preferences
                        </div>
                        <div
                          className={`py-2 px-3 -mx-3 cursor-pointer hover:bg-muted/50 rounded transition-colors ${
                            activeSection === "language" ? "text-primary font-medium" : "text-foreground"
                          }`}
                          onClick={() => setActiveSection("language")}
                        >
                          Language & Region
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* My Activities - Hide only for wholesalers */}
                  {userRole !== "wholesaler" && (
                  <div>
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Heart className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-sm text-muted-foreground">MY ACTIVITIES</span>
                      </div>
                      <div className="ml-8 space-y-1">
                        <div
                          className={`py-2 px-3 -mx-3 cursor-pointer hover:bg-muted/50 rounded transition-colors ${
                            activeSection === "wishlist-page" ? "text-primary font-medium" : "text-foreground"
                          }`}
                          onClick={() => navigate("/wishlist")}
                        >
                          My Wishlist
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Support */}
                  <div>
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <HelpCircle className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-sm text-muted-foreground">SUPPORT</span>
                      </div>
                      <div className="ml-8 space-y-1">
                        <div
                          className={`py-2 px-3 -mx-3 cursor-pointer hover:bg-muted/50 rounded transition-colors ${
                            activeSection === "help" ? "text-primary font-medium" : "text-foreground"
                          }`}
                          onClick={() => setActiveSection("help")}
                        >
                          Help Center
                        </div>
                        <div
                          className={`py-2 px-3 -mx-3 cursor-pointer hover:bg-muted/50 rounded transition-colors ${
                            activeSection === "contact" ? "text-primary font-medium" : "text-foreground"
                          }`}
                          onClick={() => navigate("/contact")}
                        >
                          Contact Us
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeSection === "profile" && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-1">Personal Information</h2>
                  <Button 
                    variant="link" 
                    className="text-primary p-0 h-auto mb-6"
                    onClick={() => setActiveSection("edit-profile")}
                  >
                    Edit
                  </Button>

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Input
                          placeholder="First Name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="bg-muted/30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder="Last Name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="bg-muted/30"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-normal text-muted-foreground">Your Gender</Label>
                      <RadioGroup value={gender} onValueChange={setGender} className="flex gap-6">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="male" />
                          <Label htmlFor="male" className="font-normal cursor-pointer">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="female" />
                          <Label htmlFor="female" className="font-normal cursor-pointer">Female</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-3 border-t pt-6">
                      <h3 className="font-semibold">Email Address</h3>
                      <Button variant="link" className="text-primary p-0 h-auto">Edit</Button>
                      <Input
                        type="email"
                        value={userEmail}
                        disabled
                        className="bg-muted/30"
                      />
                    </div>

                    <div className="space-y-3 border-t pt-6">
                      <h3 className="font-semibold">Mobile Number</h3>
                      <Button variant="link" className="text-primary p-0 h-auto">Edit</Button>
                      <Input
                        type="tel"
                        placeholder="+919346315392"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-muted/30"
                      />
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-semibold mb-2">FAQs</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium text-sm">What happens when I update my email address (or mobile number)?</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Your login email id (or mobile number) changes, likewise. You'll receive all your account related communication on your updated email address (or mobile number).
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit"
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover"
                    >
                      Save Changes
                    </Button>
                  </form>
                </Card>
              )}

              {activeSection === "addresses" && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Manage Addresses</h2>
                    <Button
                      onClick={() => navigate("/add-address")}
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Address
                    </Button>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="text-center py-12">
                      <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No saved addresses yet</p>
                      <Button onClick={() => navigate("/add-address")} variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Address
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <Card key={address.id} className="border-2 hover:border-primary/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <MapPin className="h-4 w-4 text-primary" />
                                  <h3 className="font-semibold">{address.label || "Address"}</h3>
                                  {address.is_default && (
                                    <Badge className="bg-gradient-to-r from-primary to-secondary">Default</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {address.line1}
                                </p>
                                {address.line2 && (
                                  <p className="text-sm text-muted-foreground">
                                    {address.line2}
                                  </p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                  {address.city}, {address.state} - {address.pincode}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {address.country || "India"}
                                </p>
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
                                  size="icon"
                                  onClick={() => handleDeleteAddress(address.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {activeSection === "password" && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Change Password</h2>
                  <form onSubmit={async (e) => {
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
                  }} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="new_password">New Password</Label>
                      <Input
                        id="new_password"
                        name="new_password"
                        type="password"
                        placeholder="Enter new password"
                        required
                        minLength={6}
                        className="bg-muted/30"
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
                        className="bg-muted/30"
                      />
                    </div>

                    <Button 
                      type="submit"
                      disabled={changingPassword}
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover"
                    >
                      {changingPassword ? "Changing..." : "Change Password"}
                    </Button>
                  </form>
                </Card>
              )}

              {activeSection === "security" && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Two-Factor Authentication</h3>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                      </div>
                      <Button variant="outline">Enable</Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Login Sessions</h3>
                        <p className="text-sm text-muted-foreground">Manage devices where you're currently logged in</p>
                      </div>
                      <Button variant="outline">View Sessions</Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Account Activity</h3>
                        <p className="text-sm text-muted-foreground">Review recent activity on your account</p>
                      </div>
                      <Button variant="outline">View Activity</Button>
                    </div>

                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <h3 className="font-semibold text-destructive mb-2">Delete Account</h3>
                      <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all associated data</p>
                      <Button variant="destructive" size="sm">Delete Account</Button>
                    </div>
                  </div>
                </Card>
              )}

              {activeSection === "notifications" && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Email Notifications</h3>
                        <p className="text-sm text-muted-foreground">Receive order updates and promotional emails</p>
                      </div>
                      <Button 
                        variant={emailNotifications ? "default" : "outline"}
                        onClick={async () => {
                          const newValue = !emailNotifications;
                          setEmailNotifications(newValue);
                          
                          try {
                            await supabase
                              .from("profiles")
                              .update({ email_notifications: newValue })
                              .eq("id", profile.id);
                            
                            toast({
                              title: "Updated",
                              description: `Email notifications ${newValue ? 'enabled' : 'disabled'}`,
                            });
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description: error.message,
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        {emailNotifications ? "Enabled" : "Disabled"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">SMS Notifications</h3>
                        <p className="text-sm text-muted-foreground">Get text messages for important order updates</p>
                      </div>
                      <Button 
                        variant={smsNotifications ? "default" : "outline"}
                        onClick={async () => {
                          const newValue = !smsNotifications;
                          setSmsNotifications(newValue);
                          
                          try {
                            await supabase
                              .from("profiles")
                              .update({ sms_notifications: newValue })
                              .eq("id", profile.id);
                            
                            toast({
                              title: "Updated",
                              description: `SMS notifications ${newValue ? 'enabled' : 'disabled'}`,
                            });
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description: error.message,
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        {smsNotifications ? "Enabled" : "Disabled"}
                      </Button>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-3">Notification Types</h3>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <div>
                            <p className="font-medium text-sm">Order Updates</p>
                            <p className="text-xs text-muted-foreground">Get notified about order status changes</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <div>
                            <p className="font-medium text-sm">Promotional Offers</p>
                            <p className="text-xs text-muted-foreground">Receive deals and discounts</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="rounded" />
                          <div>
                            <p className="font-medium text-sm">Product Recommendations</p>
                            <p className="text-xs text-muted-foreground">Get personalized product suggestions</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {activeSection === "language" && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Language & Region</h2>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const { error } = await supabase
                        .from("profiles")
                        .update({
                          language,
                          currency,
                          timezone,
                        })
                        .eq("id", profile.id);

                      if (error) throw error;

                      toast({
                        title: "Success",
                        description: "Language & region preferences saved successfully",
                      });
                      fetchProfile();
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message,
                        variant: "destructive",
                      });
                    }
                  }} className="space-y-6">
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-muted/30"
                      >
                        <option value="en">English</option>
                        <option value="hi">हिन्दी (Hindi)</option>
                        <option value="ta">தமிழ் (Tamil)</option>
                        <option value="te">తెలుగు (Telugu)</option>
                        <option value="bn">বাংলা (Bengali)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <select 
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-muted/30"
                      >
                        <option value="INR">₹ INR - Indian Rupee</option>
                        <option value="USD">$ USD - US Dollar</option>
                        <option value="EUR">€ EUR - Euro</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Time Zone</Label>
                      <select 
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-muted/30"
                      >
                        <option value="IST">IST - Indian Standard Time (UTC+5:30)</option>
                        <option value="PST">PST - Pacific Standard Time (UTC-8)</option>
                        <option value="EST">EST - Eastern Standard Time (UTC-5)</option>
                      </select>
                    </div>

                    <Button 
                      type="submit"
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover"
                    >
                      Save Preferences
                    </Button>
                  </form>
                </Card>
              )}

              {activeSection === "help" && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Help Center</h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer">
                        <h3 className="font-semibold mb-2">📦 Order Issues</h3>
                        <p className="text-sm text-muted-foreground">Track, modify, or cancel orders</p>
                      </div>
                      <div className="p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer">
                        <h3 className="font-semibold mb-2">💳 Payment & Refunds</h3>
                        <p className="text-sm text-muted-foreground">Payment methods and refund policies</p>
                      </div>
                      <div className="p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer">
                        <h3 className="font-semibold mb-2">🚚 Delivery Info</h3>
                        <p className="text-sm text-muted-foreground">Shipping and delivery details</p>
                      </div>
                      <div className="p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer">
                        <h3 className="font-semibold mb-2">🔐 Account Security</h3>
                        <p className="text-sm text-muted-foreground">Protect your account</p>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-semibold mb-4">Frequently Asked Questions</h3>
                      <div className="space-y-3">
                        <details className="p-3 border rounded-lg">
                          <summary className="font-medium cursor-pointer">How do I track my order?</summary>
                          <p className="text-sm text-muted-foreground mt-2">Go to "My Orders" section and click on the "Track" button next to your order.</p>
                        </details>
                        <details className="p-3 border rounded-lg">
                          <summary className="font-medium cursor-pointer">What is the return policy?</summary>
                          <p className="text-sm text-muted-foreground mt-2">You can return most items within 7 days of delivery for a full refund.</p>
                        </details>
                        <details className="p-3 border rounded-lg">
                          <summary className="font-medium cursor-pointer">How do I change my delivery address?</summary>
                          <p className="text-sm text-muted-foreground mt-2">Visit "Manage Addresses" to add, edit, or remove delivery addresses.</p>
                        </details>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
  );

  // Wrap in WholesalerLayout if coming from wholesaler dashboard
  if (showWholesalerLayout) {
    return (
      <WholesalerLayout 
        title="Profile" 
        activePage="dashboard"
        userName={profile?.full_name}
      >
        {renderProfileContent()}
      </WholesalerLayout>
    );
  }

  // Wrap in RetailerLayout if coming from retailer dashboard
  if (showRetailerLayout) {
    return (
      <RetailerLayout 
        title="Profile" 
        activePage="dashboard"
        profile={profile}
      >
        {renderProfileContent()}
      </RetailerLayout>
    );
  }

  // Default Amazon-style layout for customers and retailers from marketplace
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <AmazonHeader
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        userName={profile?.full_name?.split(" ")[0]}
        onSignOut={handleSignOut}
        userRole={userRole || "customer"}
      />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {renderProfileContent()}
        </div>
      </main>

      <AmazonFooter />
    </div>
  );
};

export default Profile;
