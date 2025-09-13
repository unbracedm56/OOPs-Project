import React from 'react';
import './ProfileSubpage.css';

const ContactUs: React.FC = () => {
  return (
    <div className="profile-subpage layout-content">
      <div className="sub-card">
        <h2>Contact Us</h2>
        <p className="muted">We're here to help — send us a message and we'll get back to you.</p>
        <form className="contact-form">
          <label>Name<input placeholder="Your name" /></label>
          <label>Email<input placeholder="Email" /></label>
          <label>Message<textarea placeholder="How can we help?" /></label>
          <div style={{marginTop:12}}><button className="primary">Send message</button></div>
        </form>
      </div>
    </div>
  );
};

export default ContactUs;
