import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const categories = [
  { name: 'Electronics', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80' },
  { name: 'Food', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80' },
  { name: 'Clothing', image: 'https://images.unsplash.com/photo-1520975910283-9d6e88d2a1b4?auto=format&fit=crop&w=800&q=80' },
  { name: 'Home Goods', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' },
  { name: 'Toys', image: 'https://images.unsplash.com/photo-1582858442485-8a9a9f1a6d9b?auto=format&fit=crop&w=800&q=80' },
  { name: 'Books', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80' },
];

const recentItems = [
  { name: 'Electronics', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80' },
  { name: 'Food', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80' },
  { name: 'Clothing', image: 'https://images.unsplash.com/photo-1520975910283-9d6e88d2a1b4?auto=format&fit=crop&w=800&q=80' },
  { name: 'Home Goods', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' },
];

const HomePage: React.FC = () => {
  return (
    <div className="home-page layout-content">
      <div className="search-wrap">
        <div>
          <input className="search-field" placeholder="Search products, brands, and categories" />
        </div>
      </div>

      <section className="section">
        <h2>Pick up where you left off</h2>
        <div className="cards-row">
          {recentItems.map((item, i) => (
            <Link key={i} to={`/category/${item.name.toLowerCase()}`} className="pickup-card">
              <img className="pickup-image" src={item.image} alt={item.name} loading="lazy" />
              <h3>{item.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Shop by Category</h2>
        <div className="category-grid">
          {categories.map((cat, i) => (
            <Link key={i} to={`/category/${cat.name.toLowerCase()}`} className="category-tile">
              <img className="tile-image" src={cat.image} alt={cat.name} loading="lazy" />
              <p>{cat.name}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
