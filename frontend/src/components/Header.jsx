import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Icon from './Icon';

const ADVOCATE_LINKS = [
  { to: '/case-search', icon: 'court', label: 'eCourts' },
  { to: '/ai-assistant', icon: 'ai', label: 'AI Assistant' },
  { to: '/clients', icon: 'clients', label: 'Clients' },
  { to: '/templates', icon: 'case', label: 'Drafts' },
  { to: '/billing', icon: 'billing', label: 'Billing' },
  { to: '/archive', icon: 'archive', label: 'Archive' },
  { to: '/tasks', icon: 'tasks', label: 'Tasks' },
  { to: '/diary', icon: 'calendar', label: 'Diary' },
];

export default function Header() {
  const { advocate, logout } = useAuth();
  const { toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  
  const navRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    setAvatarError(false);
  }, [advocate?.avatar_url]);

  useEffect(() => {
    setNavOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (
        navRef.current && !navRef.current.contains(e.target) &&
        toggleBtnRef.current && !toggleBtnRef.current.contains(e.target)
      ) {
        setNavOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setNavOpen(false);
        setProfileMenuOpen(false);
      }
    };
    const onResize = () => {
      if (window.innerWidth > 1024) setNavOpen(false);
    };

    document.addEventListener('click', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('click', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const handleLogout = () => {
    setProfileMenuOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="header-main">
      {/* 1. Left: Brand & Title */}
      <div className="header-brand">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link to="/" className="header-brand-link">
            <img src="/logo.jpeg" alt="Logo" className="header-logo-img" />
            <h1>Advo <span>Buddy</span></h1>
          </Link>
        </motion.div>
        {advocate && (
          <span className="advo-badge-pill">
            <span className="advo-badge-dot" />
            <span>Chambers Counsel</span>
          </span>
        )}
      </div>

      {/* 2. Center: Core Navigation Links */}
      {advocate && (
        <nav className={`nav-links${navOpen ? ' open' : ''}`} id="nav-links" ref={navRef}>
          {ADVOCATE_LINKS.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link${isActive ? ' active' : ''}`}
                style={{ position: 'relative' }}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeNavIndicator"
                    className="nav-link-indicator"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(212, 175, 55, 0.16)',
                      border: '1px solid rgba(212, 175, 55, 0.45)',
                      borderRadius: 'var(--radius-full)',
                      boxShadow: '0 0 16px rgba(212, 175, 55, 0.15)',
                      zIndex: 0,
                    }}
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon name={link.icon} />
                  <span>{link.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* 3. Right: Action Controls & User Popover */}
      <div className="header-controls">
        {advocate && (
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to="/add" className="btn-add-nav">
              <span className="btn-add-text">+ Add Case</span>
              <span className="btn-add-short">+ Case</span>
            </Link>
          </motion.div>
        )}

        <motion.button
          className="theme-toggle"
          id="theme-toggle-btn"
          title="Toggle Light/Dark Mode"
          onClick={toggleTheme}
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92, rotate: 15 }}
          transition={{ duration: 0.15 }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path className="sun-icon" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
            <path className="moon-icon" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
          </svg>
        </motion.button>

        {advocate && (
          <div className="header-profile-container" ref={profileRef}>
            <button
              type="button"
              className="header-user-btn"
              onClick={() => setProfileMenuOpen((v) => !v)}
              aria-expanded={profileMenuOpen}
              title="Account Settings"
            >
              {advocate.avatar_url && !avatarError ? (
                <img
                  src={advocate.avatar_url}
                  alt="Avatar"
                  className="header-user-avatar"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <Icon name="user" style={{ width: 16, height: 16 }} />
              )}
              <span className="header-user-name">
                {advocate.name || 'Advocate'}
              </span>
              <Icon name="chevronDown" className="header-user-chevron" style={{ width: 12, height: 12, opacity: 0.7 }} />
            </button>

            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  className="header-profile-dropdown"
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="header-dropdown-header">
                    <div className="header-dropdown-name">{advocate.name || 'Counsel'}</div>
                    <div className="header-dropdown-email">{advocate.email}</div>
                    <div style={{ marginTop: 6 }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 10,
                          background: 'rgba(229, 184, 105, 0.18)',
                          color: 'var(--accent)',
                          border: '1px solid rgba(229, 184, 105, 0.4)',
                        }}
                      >
                        ⚖️ Practicing Advocate
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Link to="/settings" className="header-dropdown-item" onClick={() => setProfileMenuOpen(false)}>
                      <Icon name="settings" style={{ width: 15, height: 15 }} />
                      <span>Settings & Profile</span>
                    </Link>

                    <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }}></div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="header-dropdown-item danger"
                    >
                      <Icon name="back" style={{ width: 15, height: 15, transform: 'rotate(180deg)' }} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {advocate && (
          <button
            ref={toggleBtnRef}
            className="nav-toggle"
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={navOpen}
            aria-controls="nav-links"
            onClick={(e) => { e.stopPropagation(); setNavOpen((v) => !v); }}
          >
            <span className="nav-toggle-bar"></span>
            <span className="nav-toggle-bar"></span>
            <span className="nav-toggle-bar"></span>
          </button>
        )}
      </div>
    </header>
  );
}
