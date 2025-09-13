import React from 'react';
import './LoginSecurity.css';

const LoginSecurity: React.FC = () => {
  return (
    <div className="login-sec-page">
      <div className="container">
        <h1>Login & Security</h1>
        <div className="card">
          <div className="row">
            <div>
              <div className="label">Email</div>
              <div className="value">sarah@example.com</div>
            </div>
            <button className="btn">Change</button>
          </div>

          <div className="row">
            <div>
              <div className="label">Phone</div>
              <div className="value">(555) 987-6543</div>
            </div>
            <button className="btn">Change</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSecurity;
