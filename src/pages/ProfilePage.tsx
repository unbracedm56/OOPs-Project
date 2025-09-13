import React, { useState } from 'react';
import './ProfilePage.css';
import { Link } from 'react-router-dom';

const tiles = [
  { title: 'Your Orders', to: '/orders' },
  { title: 'Wishlist', to: '/wishlist' },
  { title: 'Login & Security', to: '/security' },
  { title: 'Payment Options', to: '/payment-options' },
  { title: 'Saved Addresses', to: '/addresses' },
  { title: 'Contact Us', to: '/contact' },
];

const ProfilePage: React.FC = () => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const onSignOut = () => setConfirmOpen(true);
  const cancelSignOut = () => setConfirmOpen(false);
  const confirmSignOut = () => {
    // navigate to landing page
    window.location.href = '/';
  };
  return (
    <div className="account-page">
      <div className="container">
        <div className="header-card">
          <h1>Your Account</h1>
          <p className="muted">Welcome back, Sarah!</p>
        </div>

        <div className="tiles-grid">
          {tiles.map((t) => (
            <Link key={t.title} to={t.to} className="tile">
              <div className="ico" />
              <div className="title">{t.title}</div>
              <div className="chev">›</div>
            </Link>
          ))}
        </div>

        <div style={{marginTop:32}}>
          <button className="btn signout" onClick={onSignOut}>Sign Out</button>
        </div>

        {confirmOpen && (
          <div className="confirm-overlay" onClick={cancelSignOut}>
            <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
              <h3>Confirm Sign Out</h3>
              <p>Are you sure you want to sign out?</p>
              <div className="confirm-actions">
                <button className="btn" onClick={cancelSignOut}>No</button>
                <button className="btn signout" onClick={confirmSignOut}>Yes</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
