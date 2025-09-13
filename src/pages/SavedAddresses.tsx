import React from 'react';
import './ProfileSubpage.css';

const SavedAddresses: React.FC = () => {
  return (
    <div className="profile-subpage layout-content">
      <div className="sub-card">
        <h2>Saved Addresses</h2>
        <p className="muted">Manage your shipping and billing addresses.</p>
        <div className="empty-state">No saved addresses yet.</div>
      </div>
    </div>
  );
};

export default SavedAddresses;
