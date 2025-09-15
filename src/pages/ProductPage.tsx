import React from 'react';
import { Link } from 'react-router-dom';
import './ProductPage.css';

const images = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAFhg3rQn8VvCKALLZ0-PRvFNMcVJaYYENlFx4bgriO6CsnrfK-Ak5om0q-UVCcLOXbm5O367avFJ7t9awj3jvQNt5I22ihjAqUz4IAvHcDSIib_n0XjnifuD2SrntQUDWCeKZyf_qxvEI81ezK6W1H1EjzDqi_7In7Ra9ZL1k2DJxOJpOqjzQ7oVL6pLBKL10qQZcYy6xe_D_z9TSsIrjDMcIE6Et-MvUvjLyJOWLTY1rMKjzMt0SMLC37m2-4aM6t597bOEqatr2m',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBF8EWmFNG3cvbTXGEv2U6ssm676WfjaC_1mp9WB-MqhPf33AILg8DXMixRyjCOhLuTraqAGyPGHsRAP17wrvkl9enz5WvOGV1O0V2w-dMlNoRX5DfG3-lqD4opV-OJYVPCT4awLSb3YFMLh5cov7L1lKm4Owmo6NkYJGEUQZIHjIV3AJtxxGnpXrSUxD48QeUvfjR-6CZAt4_epoyvCJ8c-n7t0l5iJ5POBV5r9iP4ZgGfs6ZS56XqkfyAlA-_6BPr_RKjbk1KdOY7',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDZSbMRZpV893RyRYeCW3LsU7EHoLST_dIHSvYZ7zqjreJH07qnh1Yku2x7ciD9zQUthFcLyy8mlWWQo-VE9Cmj-1Ea2vnEwhIk9pdP9XejcK7x1JyUKpUt3El_sPGBOhVL6sYjp4FNDsHr-zJ3krB1dieMpvE9u3ldUARtrx0EJk0H-sRCwI3683dlYygTrDuOJCk1-L3zKSvs2s7u_3acvq8kv6bSUDvD6o3pfh3kUMHjN5TCHsWabDg3pqzoWwJXFBo1aKg89SPW',
];

const similarItems = [
  { name: "Men's Crew Neck T-Shirt", subtitle: 'This item', rating: 4.0, price: '$19.99', image: images[0] },
  { name: "Men's V-Neck T-Shirt", subtitle: 'Similar style', rating: 4.2, price: '$21.99', image: images[1] },
  { name: "Men's Pocket T-Shirt", subtitle: 'With added feature', rating: 4.5, price: '$24.99', image: images[2] },
];

// frequentlyBought removed — section deleted from UI

const reviews = [
  { name: 'Alex Johnson', date: '2 days ago', rating: 4, text: "The fabric is so soft and the fit is perfect. I've already ordered another one in a different color!", avatar: 'https://lh3.googleusercontent.com/a-/ACNPEu807uIUUQd620H6V5h3x2r3tE6q-2uYh_p2fT0H=s96-c' },
  { name: 'Samantha Miller', date: '1 week ago', rating: 5, text: "Great quality t-shirt. It's become a staple in my wardrobe.", avatar: 'https://lh3.googleusercontent.com/a-/ACNPEu9Yh4u2jC8i6O_S9qG-zGgN0z1F1T5Q1k2jQJ0R=s96-c' },
];

const ProductPage: React.FC = () => {
  // frequently bought section removed; no total price needed

  return (
    <div className="product-page">
      <div className="container">
        <nav className="breadcrumb">
          <span>Clothing</span>
          <span className="chev">›</span>
          <span className="current">T-Shirts</span>
        </nav>

        <div className="product-grid">
          <div className="gallery">
            <div className="main-image" style={{ backgroundImage: `url(${images[0]})` }} />
            <div className="thumbs">
              <div className="thumb" style={{ backgroundImage: `url(${images[1]})` }} />
              <div className="thumb" style={{ backgroundImage: `url(${images[2]})` }} />
            </div>
          </div>

          <div className="details">
            <h1 className="title">Men's Crew Neck T-Shirt</h1>
            <p className="muted">Expected Delivery: 2-3 business days</p>

            <div className="price-row">
              <p className="mrp">MRP: <span>$29.99</span></p>
              <p className="price">$19.99</p>
            </div>

            <div className="actions">
              <Link to="/checkout" className="btn primary">Buy Now</Link>
              <button className="btn outline">Add to Cart</button>
            </div>

            <section className="desc">
              <h3>Product Description</h3>
              <p>This classic crew neck t-shirt is made from soft, breathable cotton for all-day comfort. Its versatile design makes it perfect for layering or wearing on its own. Available in a range of colors to suit your style.</p>
            </section>

            <section className="features">
              <h3>Key Features</h3>
              <ul>
                <li>100% Cotton</li>
                <li>Machine Washable</li>
                <li>Regular Fit</li>
                <li>Imported</li>
              </ul>
            </section>
          </div>
        </div>

        <section className="compare">
          <h2>Compare with Similar Items</h2>
          <div className="table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="center">Rating</th>
                  <th className="center">Price</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {similarItems.map((it, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'striped' : ''}>
                    <td>
                      <div className="prod-row">
                        <div className="thumb-sm" style={{ backgroundImage: `url(${it.image})` }} />
                        <div>
                          <div className="prod-name">{it.name}</div>
                          <div className="prod-sub">{it.subtitle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="center"><div className="rating"><span>{it.rating.toFixed(1)}</span><span className="star">★</span></div></td>
                    <td className="center price-col">{it.price}</td>
                    <td><button className="btn small outline">Add to Cart</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Frequently bought together removed per design request */}

        <section className="reviews">
          <div className="reviews-head">
            <h2>Customer Reviews</h2>
            <button className="btn small primary">Write a review</button>
          </div>

          <div className="rating-summary">
            <div className="stars">
              <span className="star-lg">★</span>
              <span className="star-lg">★</span>
              <span className="star-lg">★</span>
              <span className="star-lg">★</span>
              <span className="star-muted">★</span>
            </div>
            <div className="avg">4.0</div>
            <div className="count">Based on 123 reviews</div>
          </div>

          <div className="review-list">
            {reviews.map((r, i) => (
              <div className="review" key={i}>
                <img className="avatar" src={r.avatar} alt={r.name} />
                <div className="review-body">
                  <div className="review-head">
                    <div>
                      <div className="rname">{r.name}</div>
                      <div className="rdate">{r.date}</div>
                    </div>
                    <div className="rrating">{Array.from({length: r.rating}).map((_,i)=>(<span key={i} className="star-small">★</span>))}<span className="star-muted">{Array.from({length:5-r.rating}).map((_,i)=>(<span key={i} className="star-small muted">★</span>))}</span></div>
                  </div>
                  <p className="rtext">{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductPage;
