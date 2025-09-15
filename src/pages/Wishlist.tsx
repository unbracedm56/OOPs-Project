import React from 'react';
import './ProfileSubpage.css';

const Wishlist: React.FC = () => {
  return (
    <div className="profile-subpage layout-content">
      <div className="sub-card">
        <h2>Your Wishlist</h2>
        <p className="muted">Items you saved to buy later.</p>
        <div className="empty-state">Your wishlist is empty.</div>
      </div>
    </div>
  );
};

export default Wishlist;
