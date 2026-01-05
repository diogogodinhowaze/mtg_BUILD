import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isAuthenticated, logout } from '../services/auth';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  useEffect(() => {
    // Check authentication status on mount and when location changes
    setAuthenticated(isAuthenticated());
  }, [location]);

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="logo">
          🎴 MTG Deck Builder
        </Link>
        <nav className="main-nav">
          <Link to="/" className={`nav-link ${isActive('/')}`}>
            Home
          </Link>
          <Link to="/search" className={`nav-link ${isActive('/search')}`}>
            Search
          </Link>
          <Link to="/decks" className={`nav-link ${isActive('/decks')}`}>
            My Decks
          </Link>
          {authenticated && (
            <Link to="/admin" className={`nav-link ${isActive('/admin')}`}>
              Admin
            </Link>
          )}
        </nav>
        <div className="auth-actions">
          {authenticated ? (
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          ) : (
            <Link to="/login" className="login-button">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
