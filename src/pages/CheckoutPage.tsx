import React from 'react';
import './CheckoutPage.css';
import { Link, useNavigate } from 'react-router-dom';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();

  const handlePlaceOrder = () => {
    // compute total (mirror the static total used in the UI)
    const total = 26.49;
    const stored = localStorage.getItem('selected_payment_method');
    const payment = stored ? JSON.parse(stored) : null;
    navigate('/bank-pay', { state: { amount: total, merchant: 'Your Favorite Store', payment } });
  };

  return (
    <main className="checkout-page">
      <div className="container">
        <nav className="crumbs">Bag / <span className="muted">Checkout</span></nav>
        <h1 className="page-title">Checkout</h1>

        <div className="grid">
          <div className="left">
            <section className="card">
              <div className="card-head">
                <h3>Delivery Address</h3>
                <Link to="/add-address" className="change">Change</Link>
              </div>
              <div className="card-body address">
                <div>
                  <div className="name">Sophia Clark</div>
                  <div className="meta">Phone: (555) 123-4567</div>
                  <div className="meta">123 Maple Street, Apt 4B, Anytown, CA 91234</div>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="card-head">
                <h3>Payment Method</h3>
                <Link to="/payment-method" className="change">Change</Link>
              </div>
              <div className="card-body payment">
                <div className="card-logo">Visa</div>
                <div className="meta">Ending in 4242</div>
              </div>
            </section>

            <section className="card">
              <h3>Discounts & Coupons</h3>
              <div className="card-body coupon">
                <input placeholder="Enter coupon code" />
                <button className="btn small">Apply</button>
              </div>
            </section>
          </div>

          <aside className="right">
            <section className="card order">
              <h3>Order Summary</h3>
              <div className="items">
                <div className="row"><div>Men's Crew Neck T-Shirt</div><div>$19.99</div></div>
                <div className="row muted"><div>Subtotal</div><div>$19.99</div></div>
                <div className="row muted"><div>Shipping</div><div>$5.00</div></div>
                <div className="row muted"><div>Tax</div><div>$1.50</div></div>
                <div className="row total"><div>Total</div><div>$26.49</div></div>
              </div>
              <button className="btn place" onClick={handlePlaceOrder}>Place Order</button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default CheckoutPage;
