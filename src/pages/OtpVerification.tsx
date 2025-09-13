import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './OtpVerification.css';

type LocState = { amount?: number; phoneSuffix?: string };

const OtpVerification: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as LocState;
  const phoneSuffix = state.phoneSuffix ?? '1234';

  const [otp, setOtp] = useState(Array(6).fill(''));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const onChange = (idx: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    // simulate API call
    if (code.length !== 6) {
      alert('Please enter the 6-digit code');
      return;
    }

    // fake network delay
    setTimeout(() => {
      if (code === '111111') {
        // on success, navigate to order success and pass a fake order id
        navigate('/order-success', { state: { orderId: '#123456789' } });
      } else {
        // on failure
        navigate('/payment-failed');
      }
    }, 900);
  };

  const resend = () => {
    setSeconds(60);
    setOtp(Array(6).fill(''));
    inputsRef.current[0]?.focus();
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="otp-page">
      <header className="otp-header">ShopOnline</header>
      <main className="otp-main">
        <form className="otp-card" onSubmit={handleSubmit}>
          <h2>OTP Verification</h2>
          <p className="muted">Please enter the 6-digit code sent to your registered mobile number ending in <strong>{phoneSuffix}</strong>.</p>

          <div className="otp-inputs">
            {otp.map((v, i) => (
              <input
                key={i}
                ref={(el) => { inputsRef.current[i] = el; return; }}
                value={v}
                onChange={(e) => onChange(i, e.target.value)}
                maxLength={1}
                inputMode="numeric"
                pattern="[0-9]*"
              />
            ))}
          </div>

          <div className="otp-footer">
            <div className="expire">Code expires in: <strong>{pad(seconds)}</strong></div>
            <button type="button" className="resend" onClick={resend}>Resend OTP</button>
          </div>

          <button className="btn submit" type="submit">Submit</button>
        </form>
      </main>
    </div>
  );
};

export default OtpVerification;
