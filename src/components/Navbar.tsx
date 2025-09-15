import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

interface Props {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Navbar: React.FC<Props> = ({ theme, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const pathname = location.pathname;
  const onAvatarClick = () => navigate('/profile');
  const storedAvatar = typeof window !== 'undefined' ? localStorage.getItem('shop_avatar') : null;
  // treat signup and landing as minimal-header pages
  const hideOnMinimal = ['/', '/signup-details'];

  return (
    <header className={`site-nav ${theme}`}>
      <div className="nav-inner">
        <div className="nav-left">
          <div className="brand">
            <div className="brand-icon" aria-hidden>
              <svg viewBox="0 0 48 48" width="28" height="28" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"></path>
              </svg>
            </div>
            <span className="brand-text">ShopSmart</span>
          </div>

          {!hideOnMinimal.includes(pathname) && pathname !== '/home' && (
            <button className="home-btn" aria-label="Home" onClick={() => navigate('/home')}>Home</button>
          )}

        </div>

          <div className="nav-right">
            {!hideOnMinimal.includes(pathname) && (
            <Link to="/checkout" className="icon-btn" title="Cart" aria-label="View cart" style={{textDecoration: 'none'}}>
              🛒
            </Link>
            )}
          <button className="theme-toggle icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          {/* show avatar on all pages except landing (path '/') */}
          {!hideOnMinimal.includes(pathname) && (
            <button
              className="avatar-btn"
              aria-label="Profile"
              onClick={onAvatarClick}
              onKeyDown={(e) => e.key === 'Enter' && onAvatarClick()}
              style={{ backgroundImage: `url(${storedAvatar || 'https://i.pravatar.cc/40'})` }}
            />
          )}
        </div>
      </div>

      {/* avatar now navigates to profile page */}
    </header>
  );
};

export default Navbar;
