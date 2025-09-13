import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customer' | 'retailer' | 'wholesaler'>('customer');
  const customerRef = useRef<HTMLDivElement | null>(null);

  const handleShopNow = (e: React.MouseEvent) => {
    // Scroll to customer sign-in section
    const el = document.getElementById('login-customer');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="landing-page">
      <header className="hero"> 
        <div className="hero-overlay">
          <div className="hero-content">
            <h1>Welcome to ShopSmart</h1>
            <p>Your one-stop shop for everything you need. Explore our wide selection of products and enjoy great deals every day.</p>
            <div className="cta-wrap"><button className="cta" onClick={handleShopNow}>Shop Now</button></div>
          </div>
        </div>
      </header>

      <section className="signin-section" aria-label="login">
        <div className="signin-card" id="login-customer" ref={customerRef}>
          <h2>Login to your account</h2>

          <div className="tabs">
            <button className={activeTab === 'customer' ? 'tab active' : 'tab'} onClick={() => setActiveTab('customer')}>Customer</button>
            <button className={activeTab === 'retailer' ? 'tab active' : 'tab'} onClick={() => setActiveTab('retailer')}>Retailer</button>
            <button className={activeTab === 'wholesaler' ? 'tab active' : 'tab'} onClick={() => setActiveTab('wholesaler')}>Wholesaler</button>
          </div>

          <div className="tab-content">
            {activeTab === 'customer' && (
              <div className="tab-panel">
                <p className="helper">By signing in, you agree to ShopSmart's Conditions of Use and Privacy Notice.</p>
                <Link to="/signup-details"><button className="signin-btn">Sign In</button></Link>
              </div>
            )}

            {activeTab === 'retailer' && (
              <div className="tab-panel">
                <p className="helper">Retailer access — manage your storefront and inventory.</p>
                <Link to="/signup-details"><button className="signin-btn">Sign In</button></Link>
              </div>
            )}

            {activeTab === 'wholesaler' && (
              <div className="tab-panel">
                <p className="helper">Wholesaler portal — bulk ordering and price lists.</p>
                <Link to="/signup-details"><button className="signin-btn">Sign In</button></Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="services-section">
        <h2>Our Services</h2>
        <div className="services-container">
          <div className="service-item">
            <h3>Fast Delivery</h3>
            <p>Get your orders delivered to your doorstep in no time.</p>
          </div>
          <div className="service-item">
            <h3>Secure Payments</h3>
            <p>Shop with confidence using our secure payment gateway.</p>
          </div>
          <div className="service-item">
            <h3>Easy Returns</h3>
            <p>Hassle-free returns on all eligible products.</p>
          </div>
        </div>
      </section>
      
      <section className="about-section" aria-label="about us">
        <h2>About Us</h2>
        <p>Meet the team behind ShopSmart — passionate people working to make shopping easy and delightful.</p>

        <div className="about-grid">
          {[
            { name: 'Aisha Khan', role: 'Founder & CEO', img: 'https://i.pravatar.cc/150?img=47', text: 'Aisha leads product and strategy, passionately building delightful shopping experiences.' },
            { name: 'Rajesh Patel', role: 'Head of Engineering', img: 'https://i.pravatar.cc/150?img=12', text: 'Rajesh oversees platform engineering and performance to keep ShopSmart fast and reliable.' },
            { name: 'Maria Gomez', role: 'Head of Design', img: 'https://i.pravatar.cc/150?img=5', text: 'Maria crafts intuitive interfaces and ensures our brand feels warm and trustworthy.' },
            { name: 'Oluwabunmi Ade', role: 'Operations Lead', img: 'https://i.pravatar.cc/150?img=30', text: 'Bunmi coordinates logistics and customer success to keep orders flowing smoothly.' },
          ].map((p) => (
            <article key={p.name} className="about-card">
              <div className="about-avatar" style={{ backgroundImage: `url(${p.img})` }} aria-hidden />
              <h3 className="about-name">{p.name}</h3>
              <p className="about-role">{p.role}</p>
              <p className="about-text">{p.text}</p>
            </article>
          ))}
        </div>
      </section>
</div>
  );
};

export default LandingPage;
