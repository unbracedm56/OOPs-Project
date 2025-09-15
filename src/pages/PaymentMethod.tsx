import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './PaymentMethod.css';

const PaymentMethod: React.FC = () => {
  const [method, setMethod] = useState<'card' | 'netbank' | 'upi' | 'cod'>('card');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [bank, setBank] = useState('');
  const [upi, setUpi] = useState('');

  const navigate = useNavigate();

  const handleContinue = () => {
    // Persist selected payment method and minimal details for demo purposes
    const payload: any = { method };
    if (method === 'card') payload.card = card;
    if (method === 'netbank') payload.bank = bank;
    if (method === 'upi') payload.upi = upi;
    localStorage.setItem('selected_payment_method', JSON.stringify(payload));
    navigate('/checkout');
  };

  return (
    <div className="pm-page">
      <div className="container">
        <nav className="crumbs">Cart &nbsp;/&nbsp; <span className="muted">Payment Method</span></nav>
        <div className="card large">
          <h1>Choose a payment method</h1>

          <div className="options">
            <label className={`option ${method === 'card' ? 'selected' : ''}`}>
              <div className="label-left">
                <div className="icon card-ico" />
                <div>
                  <div className="title">Credit/Debit Card</div>
                  <div className="sub muted">Pay securely with your card</div>
                </div>
              </div>
              <input type="radio" name="pm" checked={method === 'card'} onChange={() => setMethod('card')} />
            </label>

            <label className={`option ${method === 'netbank' ? 'selected' : ''}`}>
              <div className="label-left">
                <div className="icon bank-ico" />
                <div>
                  <div className="title">Net Banking</div>
                  <div className="sub muted">Choose your bank to pay online</div>
                </div>
              </div>
              <input type="radio" name="pm" checked={method === 'netbank'} onChange={() => setMethod('netbank')} />
            </label>

            <label className={`option ${method === 'upi' ? 'selected' : ''}`}>
              <div className="label-left">
                <div className="icon qr-ico" />
                <div>
                  <div className="title">UPI</div>
                  <div className="sub muted">Pay using UPI ID or QR</div>
                </div>
              </div>
              <input type="radio" name="pm" checked={method === 'upi'} onChange={() => setMethod('upi')} />
            </label>

            <label className={`option ${method === 'cod' ? 'selected' : ''}`}>
              <div className="label-left">
                <div className="icon cod-ico" />
                <div>
                  <div className="title">Cash on Delivery (COD)</div>
                  <div className="sub muted">Pay with cash when delivered</div>
                </div>
              </div>
              <input type="radio" name="pm" checked={method === 'cod'} onChange={() => setMethod('cod')} />
            </label>
          </div>

          {/* Detail panels for selected method */}
          {method === 'card' && (
            <div className="method-panel card-panel">
              <label>
                Card Number
                <input value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} placeholder="1234 5678 9012 3456" />
              </label>
              <div className="row">
                <label>
                  Name on Card
                  <input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                </label>
                <label>
                  Expiry
                  <input value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} placeholder="MM/YY" />
                </label>
                <label>
                  CVV
                  <input value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} placeholder="123" />
                </label>
              </div>
            </div>
          )}

          {method === 'netbank' && (
            <div className="method-panel netbank-panel">
              <label>
                Choose Bank
                <select value={bank} onChange={(e) => setBank(e.target.value)}>
                  <option value="">Select bank</option>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>SBI</option>
                  <option>Axis Bank</option>
                </select>
              </label>
            </div>
          )}

          {method === 'upi' && (
            <div className="method-panel upi-panel">
              <label>
                UPI ID
                <input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="username@bank" />
              </label>
            </div>
          )}

          {method === 'cod' && (
            <div className="method-panel cod-panel">
              <p>Pay with cash when your order is delivered.</p>
            </div>
          )}

          <button type="button" className="btn continue" onClick={handleContinue}>Continue to Payment</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethod;
