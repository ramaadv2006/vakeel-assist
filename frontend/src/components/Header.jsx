import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Icon from './Icon';

const NAV_LINKS = [
  { to: '/ai-assistant', icon: 'ai', label: 'AI Assistant' },
  { to: '/clients', icon: 'clients', label: 'Clients' },
  { to: '/templates', icon: 'case', label: 'Drafts' },
  { to: '/billing', icon: 'billing', label: 'Billing' },
  { to: '/cases/bulk-update-dates', icon: 'bulk', label: 'Bulk Import' },
  { to: '/archive', icon: 'archive', label: 'Archive' },
  { to: '/tasks', icon: 'tasks', label: 'Tasks' },
  { to: '/diary', icon: 'calendar', label: 'Diary' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
];

export default function Header() {
  const { advocate, logout } = useAuth();
  const { toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const navRef = useRef(null);
  const toggleBtnRef = useRef(null);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!navOpen) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';

    const onClickOutside = (e) => {
      if (
        navRef.current && !navRef.current.contains(e.target) &&
        toggleBtnRef.current && !toggleBtnRef.current.contains(e.target)
      ) {
        setNavOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > 900) setNavOpen(false);
    };
    document.addEventListener('click', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('click', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      document.body.style.overflow = '';
    };
  }, [navOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/logo.jpeg" alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
        <h1>Advo <span>Buddy</span></h1>
      </Link>
      <div className="header-controls">
        <button className="theme-toggle" id="theme-toggle-btn" title="Toggle Light/Dark Mode" onClick={toggleTheme} type="button">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path className="sun-icon" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
            <path className="moon-icon" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
          </svg>
        </button>
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
      {advocate && (
        <nav className={`nav-links${navOpen ? ' open' : ''}`} id="nav-links" ref={navRef}>
          <span className="nav-user" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {advocate.avatar_url ? (
              <img src={advocate.avatar_url} alt="Avatar" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--accent)' }} />
            ) : (
              <Icon name="user" />
            )}
            {advocate.name}
          </span>
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={`nav-link${location.pathname === link.to ? ' active' : ''}`}>
              <Icon name={link.icon} />
              {link.label}
            </Link>
          ))}
          <Link to="/add" className="nav-link btn-add-nav">+ Add Case</Link>
          <button onClick={handleLogout} className="nav-link" style={{ opacity: 0.85, background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
            Logout
          </button>
        </nav>
      )}
    </header>
  );
}
