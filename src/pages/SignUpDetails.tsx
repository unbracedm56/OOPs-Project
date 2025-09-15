import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUpDetails.css';

const SignUpDetails: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [avatar, setAvatar] = useState('https://i.pravatar.cc/100?img=47');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic client-side validation
    if (!name || !phone || !email) {
      alert('Please fill name, phone and email');
      return;
    }

    // save basic profile locally (demo)
    const profile = { name, phone, email, address, avatar };
    try {
      localStorage.setItem('shop_profile', JSON.stringify(profile));
      localStorage.setItem('shop_avatar', avatar);
    } catch (err) {
      // ignore storage errors
    }
    // redirect to home
    navigate('/home');
  };

  return (
    <div className="signup-page layout-content">
      <div className="signup-card">
        <h2>Almost there — just a few details</h2>
        <p className="muted">Provide basic information to complete sign in.</p>

        <form onSubmit={handleSubmit} className="signup-form">
          <label>
            Full name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
          </label>

          <label>
            Phone number
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
          </label>

          <label>
            Email address
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          </label>

          <label>
            Address
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address (optional)" />
          </label>

          <div className="avatar-select">
            <div className="label">Choose an avatar</div>
            <div className="avatars">
              {[
                'https://i.pravatar.cc/100?img=47',
                'https://i.pravatar.cc/100?img=12',
                'https://i.pravatar.cc/100?img=5',
                'https://i.pravatar.cc/100?img=30',
                'https://i.pravatar.cc/100?img=15',
              ].map((a) => (
                <button type="button" key={a} className={`avatar-option ${avatar === a ? 'active' : ''}`} onClick={() => setAvatar(a)} style={{backgroundImage: `url(${a})`}} aria-label="Select avatar" />
              ))}
            </div>
          </div>

          <div className="actions">
            <button type="submit" className="primary">Complete sign in</button>
            <button type="button" className="link" onClick={() => navigate(-1)}>Back</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUpDetails;
