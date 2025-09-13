import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './BankPayment.css';

type LocState = {
  amount?: number;
  merchant?: string;
};

const BankPayment: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as LocState;
  const amount = state.amount ?? 0.0;
  const merchant = state.merchant ?? 'Your Favorite Store';

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    // navigate to OTP verification, pass amount and a phone suffix for display
    navigate('/otp', { state: { amount, phoneSuffix: '1234' } });
  };

  return (
    <div className="bank-page">
      <header className="bank-header">
        <div className="brand">SecureBank Pay</div>
        <div className="tx">Transaction ID: 843021956 &nbsp; <span className="secure">🔒 Secure Connection</span></div>
      </header>

      <main className="bank-main">
        <form className="bank-card" onSubmit={handlePay}>
          <h2>Confirm Your Payment</h2>
          <p className="sub">You are paying <strong>${amount.toFixed(2)}</strong> to <strong>{merchant}</strong>.</p>

          <input name="account" placeholder="Account Number" required />
          <input name="ifsc" placeholder="IFSC Code" required />

          <div className="links-row">
            <button type="button" className="muted small link-btn">Need Help?</button>
          </div>

          <button className="btn pay" onClick={handlePay}>Pay Now</button>

          <hr />

          <div className="summary">
            <h4>Transaction Summary</h4>
            <div className="row"><div>Merchant</div><div className="muted">{merchant}</div></div>
            <div className="row"><div>Date</div><div className="muted">{new Date().toLocaleDateString()}</div></div>
            <div className="row"><div>Transaction Amount</div><div className="muted">${amount.toFixed(2)}</div></div>
          </div>
        </form>
      </main>

      <footer className="bank-foot">© {new Date().getFullYear()} SecureBank. All rights reserved. Your security is our priority.</footer>
    </div>
  );
};

export default BankPayment;
