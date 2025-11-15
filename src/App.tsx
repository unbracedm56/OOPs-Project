import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import RoleSelection from "./pages/RoleSelection";
import CustomerDashboard from "./pages/CustomerDashboardNew";
import RetailerDashboard from "./pages/RetailerDashboard";
import WholesalerDashboard from "./pages/WholesalerDashboard";
import RetailerInventory from "./pages/RetailerInventory";
import RetailerPurchasedProducts from "./pages/RetailerPurchasedProducts";
import RetailerProxyOrders from "./pages/RetailerProxyOrders";
import WholesalerInventory from "./pages/WholesalerInventory";
import WholesalerProxyOrders from "./pages/WholesalerProxyOrders";
import ProductDetail from "./pages/ProductDetail";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AddAddress from "./pages/AddAddress";
import CategoryPage from "./pages/CategoryPage";
import CheckoutPage from "./pages/CheckoutPage";
import ContactUs from "./pages/ContactUs";
import OrderHistory from "./pages/OrderHistory";
import OrderSuccess from "./pages/OrderSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import Wishlist from "./pages/Wishlist";
import SavedAddresses from "./pages/SavedAddresses";
import ImportProducts from "./pages/ImportProducts";
import Cart from "./pages/Cart";
import ViewCustomers from "./pages/ViewCustomers";
import ViewRetailers from "./pages/ViewRetailers";
import OrderFeedback from "./pages/OrderFeedback";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import ReviewModeration from "./pages/admin/ReviewModeration";
import AuditLogs from "./pages/admin/AuditLogs";
import Categories from "./pages/Categories";
import TodaysDeals from "./pages/TodaysDeals";
import NewArrivals from "./pages/NewArrivals";
import BestSellers from "./pages/BestSellers";
import CategoryBySlug from "./pages/CategoryBySlug";
import SearchResults from "./pages/SearchResults";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/role-selection" element={<RoleSelection />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customer-dashboard" element={<CustomerDashboard />} />
          <Route path="/retailer-dashboard" element={<RetailerDashboard />} />
          <Route path="/wholesaler-dashboard" element={<WholesalerDashboard />} />
          <Route path="/retailer/inventory" element={<RetailerInventory />} />
          <Route path="/retailer/products" element={<RetailerPurchasedProducts />} />
          <Route path="/retailer/proxy-orders" element={<RetailerProxyOrders />} />
          <Route path="/wholesaler/inventory" element={<WholesalerInventory />} />
          <Route path="/wholesaler/proxy-orders" element={<WholesalerProxyOrders />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/add-address" element={<AddAddress />} />
          <Route path="/saved-addresses" element={<SavedAddresses />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/category/deals" element={<TodaysDeals />} />
          <Route path="/category/new-arrivals" element={<NewArrivals />} />
          <Route path="/category/best-sellers" element={<BestSellers />} />
          <Route path="/category/electronics" element={<CategoryBySlug />} />
          <Route path="/category/fashion" element={<CategoryBySlug />} />
          <Route path="/category/home-kitchen" element={<CategoryBySlug />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/payment-failed" element={<PaymentFailed />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/import-products" element={<ImportProducts />} />
          <Route path="/view-customers" element={<ViewCustomers />} />
          <Route path="/view-retailers" element={<ViewRetailers />} />
          <Route path="/order-feedback/:orderId" element={<OrderFeedback />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/reviews" element={<ReviewModeration />} />
          <Route path="/admin/logs" element={<AuditLogs />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
