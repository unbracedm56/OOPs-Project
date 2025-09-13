import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './OrderSuccess.css';

const OrderSuccess: React.FC = () => {
  const { state } = useLocation();
  const orderId = (state && (state as any).orderId) || '#123456789';
  return (
    <div className="success-page">
      <div className="container">
        <div className="success-card">
          <div className="tick">✔</div>
          <h1>Thank you for your order!</h1>
          <p>Your order <strong>{orderId}</strong> has been placed successfully.</p>

          <h3>Order Summary</h3>
          <div className="items">
            <div className="item"><div className="thumb"/> <div className="meta"><div className="title">Classic Cotton T-Shirt</div><div className="sub">Size M</div></div><div className="price">$25.00</div></div>
            <div className="item"><div className="thumb"/> <div className="meta"><div className="title">Running Shoes</div><div className="sub">Size 9</div></div><div className="price">$35.00</div></div>
            <div className="item"><div className="thumb"/> <div className="meta"><div className="title">Yoga Pants</div><div className="sub">Size S</div></div><div className="price">$15.00</div></div>
          </div>

          <div className="info-row">
            <div>
              <h4>Shipping Information</h4>
              <div className="muted">Standard Shipping<br/>Estimated Delivery: 5-7 business days<br/>123 Elm Street, Anytown, CA 91234</div>
            </div>
            <div>
              <h4>Payment Information</h4>
              <div className="muted">Credit Card ending in 1234<br/>Billing Address: Same as shipping</div>
            </div>
          </div>

          <Link to="/home" className="btn done">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
