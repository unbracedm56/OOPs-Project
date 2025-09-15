import React from 'react';
import { Link } from 'react-router-dom';
import './CategoryPage.css';

const products = [
  { name: 'Wireless Headphones', subtitle: 'Immersive sound experience', price: '$129.99', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiJuFypOChhh_t8js4HlZsONR4FDESLUbOn4qzhBG6MASsvyrryVJEZnTfBi_8RIpuXGIuDtFl5Zatf2IJT8MbgyAhgQBopzRkl66GSwhNTMkvi7cJXPHIc9W3WvEs2YQgjlNqvjRL6VmjKSBHSfMq1zr0S7Q4y_W9nRs6HZbhwo5lVV0uAQF0rH7W6BOhzwiCx297-LAKHKjLDDfj0w5ejOWr3I9MmI_hsAbN1PMGXK1Xidr8r0cQ1jBlKQfdkQlaOyIRNhW9JDJB' },
  { name: 'Smartwatch', subtitle: 'Stay connected on the go', price: '$199.99', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCiAV0t6S4Uoz3Gmpcbh1WL17bKN6oALbf3SWsCVuMCM0A0L_AAGaubL_oG-WjsMQMPfyCI20ZNNTsPe8c1WXLWM8dn5VY-L4Dhab5MLEGaIytp_DKFGJqROizmITkuydGCBA5linySixN22fAQqcKumWqnjaLxCyZDZqe2-lvEQnK985OWBsB2pRIz1vod04xI1FqOBrxMkLA_bO3tX86AI510LrIaiu6UAL788I76a-VJjzopaeZ0D2AltqAoP2v01iRHnliGY_yk' },
  { name: 'Portable Bluetooth Speaker', subtitle: 'Take your music anywhere', price: '$79.99', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBP4DfuIGfjNMIk4UZ-nuwu2zJbA7rUXJGmvYvqRKXUDz2mDDh7vJKLdsaNnW0vAnrJsA-NTvdfPIiXnyU10GH3Snt2quPKPWW_WgwTZhv9RAeEHVEUEheKAOSapqma_ARy4p9bgdutHkBxwpLPGhilWZKwL1DeqUcNRVHf6Rn8ddorctcQ9VaMO-swM756Ov-H3blsOXn3VdF5T8iVmBQwu_-9spthts3UN48tu7lPqK5YU5dPhjJSIaVLvxAZeVaI8OVy_aPmyW66' },
  { name: 'Noise-Canceling Earbuds', subtitle: 'Crystal-clear audio', price: '$149.99', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd_w3eASPOtX8o205rfkJUlJqpxZUXNVIGeHsmndcWER74aojQ3Pr9s-oDfKBpZUAyT7MvDjqxdPTFMIpOqxNEbbQ6xvzU4kMyCIa9xcGI1tL-FrwYOs4_M9ik-wSNXF81zf4h34y2oFTcLrcggBE6vHXAziOVKp3ES9CbMoV3XvmkPZcQuyDE9BXXFwe8HMcOo6_gtNg8LN9LH1JOJfLdnVEmOwy9DRhSQ3Z5pdah10oplzh5GpyqhD72zyWHVKI4XNAtzrTyjlUO' },
  { name: 'Fitness Tracker', subtitle: 'Track your fitness goals', price: '$99.99', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqzRzyFl7jYxP7EjuxqzgEK7CXv6jQ28bP5p4U5YGOp51o912Z4BSUNWa4clZpb013TTPz6qt_X1ACxtdMP2qBdhH4dM7S-OmAnEJRZEf90-aaqGuKApvrTflAwgaiQXceing1XhzGQrpzU8F-NVUOKH21lSrOt8ZTT92ZFYpUNqEawrcknwv6jc2UD_7e7zS9njBCzzybDL9dYNUEuviqpXxB1lPFyeTXUdkAwwFPNQIcX9bC3cPDWcGWAxPCh4rKr2cvxu' },
  { name: 'Smart Home Hub', subtitle: 'Control your home with voice', price: '$179.99', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiCOrYhaA2EiAynDai1Yh_qjyE9x7rRkFkzpUOMRZM7rJ_-c7ynneFTqBMeXeZsySYyV4US8opZFS6P3cWWlzSWxdGnahSUKMPP-pAuZogrUkA0CcTYiqBdI_K2Lx_49aSTmw6eWZczE-rse80dx-eDWBnNxHTmRUsZt0WExBsYcQNljGulZH-GZnG2GQmwK2xm8dLuYvQ3SV0rJ5q9Yyk-PgQiU6hL73qmLkN6Y77zaIDU6XA9fEJKYWh1VV3aezNmwxPg68SMWnA' },
];

const CategoryPage: React.FC = () => {
  return (
    <div className="category-page">
      <div className="container">
        <h2 className="heading">Electronics</h2>
        <p className="sub">Explore our wide range of electronic gadgets.</p>

        <div className="search-wrap">
          <input type="search" placeholder="Search within Electronics" className="search-input" />
        </div>

        <div className="product-grid">
          {products.map((product, index) => (
            <Link to={`/product/${product.name.toLowerCase().replace(/ /g, '-')}`} key={index} className="product-card">
              <img className="card-img" src={product.image} alt={product.name} loading="lazy" />
              <div className="card-body">

                <h3 className="card-title">{product.name}</h3>
                <p className="card-sub">{product.subtitle}</p>
                <p className="card-price">{product.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
