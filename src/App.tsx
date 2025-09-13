import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentMethod from './pages/PaymentMethod';
import BankPayment from './pages/BankPayment';
import OtpVerification from './pages/OtpVerification';
import OrderSuccess from './pages/OrderSuccess';
import PaymentFailed from './pages/PaymentFailed';
import ProfilePage from './pages/ProfilePage';
import OrderHistory from './pages/OrderHistory';
import LoginSecurity from './pages/LoginSecurity';
import Wishlist from './pages/Wishlist';
import PaymentOptions from './pages/PaymentOptions';
import SavedAddresses from './pages/SavedAddresses';
import ContactUs from './pages/ContactUs';
import SignUpDetails from './pages/SignUpDetails';
import AddAddress from './pages/AddAddress';
import Navbar from './components/Navbar';

const Dashboard = () => <div style={{padding:20}}>Welcome to the Dashboard</div>;

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <Router>
      <div className={theme}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/category/:categoryName" element={<CategoryPage />} />
          <Route path="/product/:productName" element={<ProductPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment-method" element={<PaymentMethod />} />
          <Route path="/bank-pay" element={<BankPayment />} />
          <Route path="/otp" element={<OtpVerification />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/payment-failed" element={<PaymentFailed />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/security" element={<LoginSecurity />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/payment-options" element={<PaymentOptions />} />
          <Route path="/addresses" element={<SavedAddresses />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/signup-details" element={<SignUpDetails />} />
          <Route path="/add-address" element={<AddAddress />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
