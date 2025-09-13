import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddAddress.css';

const AddAddress: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const navigate = useNavigate();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Save to localStorage for demo purposes
    const addr = { name, phone, line1, line2, city, zip };
    const existing = JSON.parse(localStorage.getItem('saved_addresses') || '[]');
    existing.push(addr);
    localStorage.setItem('saved_addresses', JSON.stringify(existing));
    navigate('/checkout');
  };

  return (
    <main className="add-address-page">
      <div className="container">
        <h1>Add new address</h1>
        <form className="addr-form" onSubmit={handleSave}>
          <label>
            Full name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </label>
          <label>
            Address line 1
            <input value={line1} onChange={(e) => setLine1(e.target.value)} required />
          </label>
          <label>
            Address line 2
            <input value={line2} onChange={(e) => setLine2(e.target.value)} />
          </label>
          <div className="row">
            <label>
              City
              <input value={city} onChange={(e) => setCity(e.target.value)} required />
            </label>
            <label>
              ZIP / Postal
              <input value={zip} onChange={(e) => setZip(e.target.value)} required />
            </label>
          </div>

          <div className="actions">
            <button className="btn primary" type="submit">Save Address</button>
            <button className="btn outline" type="button" onClick={() => navigate('/checkout')}>Cancel</button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default AddAddress;
