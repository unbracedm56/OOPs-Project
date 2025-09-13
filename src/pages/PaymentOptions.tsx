import React from 'react';
import './ProfileSubpage.css';

const PaymentOptions: React.FC = () => {
  return (
    <div className="profile-subpage layout-content">
      <div className="sub-card">
        <h2>Payment Options</h2>
        <p className="muted">Manage your saved cards and payment methods.</p>
        <div className="empty-state">No payment methods saved.</div>
      </div>
    </div>
  );
};

export default PaymentOptions;
