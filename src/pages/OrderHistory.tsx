import React from 'react';
import './OrderHistory.css';

const orders = [
  { id: '#12345', date: 'July 20, 2023', status: 'Shipped', total: '$120.00' },
  { id: '#12344', date: 'June 25, 2023', status: 'Delivered', total: '$85.50' },
  { id: '#12343', date: 'May 11, 2023', status: 'Cancelled', total: '$50.00' },
  { id: '#12342', date: 'April 10, 2023', status: 'Delivered', total: '$150.75' },
];

const OrderHistory: React.FC = () => {
  return (
    <div className="orders-page">
      <div className="container">
        <h1>Order History</h1>
        <p className="muted">View your order history and manage your purchases.</p>

        <div className="orders-card">
          <div className="filters">
            <input placeholder="Search by order ID..." />
            <select><option>Filter by Date</option></select>
            <select><option>Filter by Status</option></select>
          </div>

          <div className="orders-list">
            {orders.map((o) => (
              <div key={o.id} className="order-row">
                <div className="thumb" />
                <div className="meta">
                  <div className="id">Order {o.id}</div>
                  <div className="date">{o.date}</div>
                  <div className={`status ${o.status.toLowerCase()}`}>{o.status}</div>
                </div>
                <div className="total">{o.total}</div>
                <div className="chev">›</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;
