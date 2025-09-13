import React from 'react';
import { Link } from 'react-router-dom';
import './PaymentFailed.css';

const PaymentFailed: React.FC = () => {
  return (
    <div className="failed-page">
      <div className="container">
        <div className="failed-card">
          <div className="cross">✖</div>
          <h1>Payment Failed</h1>
          <p className="muted">We're sorry — your transaction couldn't be completed. Please try again or use a different payment method.</p>

          <div className="actions">
            <Link to="/bank-pay" className="btn retry">Try Again</Link>
            <Link to="/home" className="btn home">Return Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
