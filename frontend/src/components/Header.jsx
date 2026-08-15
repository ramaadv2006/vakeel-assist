import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useFlash } from '../context/FlashContext';
import Icon from './Icon';

const ADVOCATE_LINKS = [
  { to: '/ai-assistant', icon: 'ai', label: 'AI Assistant' },
  { to: '/clients', icon: 'clients', label: 'Clients' },
  { to: '/templates', icon: 'case', label: 'Drafts' },
  { to: '/billing', icon: 'billing', label: 'Billing' },
  { to: '/archive', icon: 'archive', label: 'Archive' },
  { to: '/tasks', icon: 'tasks', label: 'Tasks' },
  { to: '/diary', icon: 'calendar', label: 'Diary' },
];

const STUDENT_LINKS = [
  { to: '/', icon: 'school', label: 'Student Hub' },
  { to: '/student/moots', icon: 'trophy', label: 'Moot Court' },
  { to: '/student/briefs', icon: 'briefs', label: 'Case Briefs' },
  { to: '/student/internships', icon: 'internship', label: 'Court Diary' },
  { to: '/student/study-deck', icon: 'deck', label: 'Study Deck' },
  { to: '/student/tutor', icon: 'tutor', label: 'AI Legal Tutor' },
  { to: '/student/tasks', icon: 'tasks', label: 'Study Tasks' },
];

export default function Header() {
  const { advocate, isStudent, switchRole, logout } = useAuth();
  const { toggleTheme } = useTheme();
  const addFlash = useFlash();
  const location = useLocation();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  
  const navRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const profileRef = useRef(null);

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

  const handleRoleToggle = async () => {
    setSwitching(true);
    setProfileMenuOpen(false);
    try {
      const targetRole = isStudent ? 'advocate' : 'student';
      const res = await switchRole(targetRole);
      addFlash(res.message || `Switched to ${targetRole === 'student' ? 'Law Student' : 'Advocate'} View`, 'success');
      navigate('/');
    } catch (err) {
      addFlash(err.message || 'Failed to switch role.', 'error');
    } finally {
      setSwitching(false);
    }
  };

  const navLinks = isStudent ? STUDENT_LINKS : ADVOCATE_LINKS;

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
      {/* 1. Left: Brand & Role */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.jpeg" alt="Logo" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
          <h1>Advo <span>Buddy</span></h1>
        </Link>
        {advocate && (
          <span className="student-badge-pill">
            {isStudent ? '🎓 Student' : '⚖️ Advocate'}
          </span>
        )}
      </div>

      {/* 2. Center: Core Navigation Links */}
      {advocate && (
        <nav className={`nav-links${navOpen ? ' open' : ''}`} id="nav-links" ref={navRef}>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link${location.pathname === link.to ? ' active' : ''}`}
            >
              <Icon name={link.icon} />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
      )}

      {/* 3. Right: Action Controls & User Popover */}
      <div className="header-controls" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {advocate && (
          isStudent ? (
            <Link to="/student/briefs?new=1" className="btn-add-nav" style={{ textDecoration: 'none' }}>
              + New Brief
            </Link>
          ) : (
            <Link to="/add" className="btn-add-nav" style={{ textDecoration: 'none' }}>
              + Add Case
            </Link>
          )
        )}

        <button
          className="theme-toggle"
          id="theme-toggle-btn"
          title="Toggle Light/Dark Mode"
          onClick={toggleTheme}
          type="button"
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path className="sun-icon" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
            <path className="moon-icon" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
          </svg>
        </button>

        {advocate && (
          <div className="header-profile-container" ref={profileRef}>
            <button
              type="button"
              className="header-user-btn"
              onClick={() => setProfileMenuOpen((v) => !v)}
              aria-expanded={profileMenuOpen}
              title="Account & Portal Settings"
            >
              {advocate.avatar_url ? (
                <img
                  src={advocate.avatar_url}
                  alt="Avatar"
                  style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <Icon name="user" style={{ width: 16, height: 16 }} />
              )}
              <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {advocate.name || 'User'}
              </span>
              <Icon name="chevronDown" style={{ width: 12, height: 12, opacity: 0.7 }} />
            </button>

            {profileMenuOpen && (
              <div className="header-profile-dropdown">
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
                        background: isStudent ? 'rgba(59, 130, 246, 0.2)' : 'rgba(212, 160, 23, 0.2)',
                        color: isStudent ? '#93c5fd' : '#fce7b0',
                        border: `1px solid ${isStudent ? 'rgba(59, 130, 246, 0.4)' : 'rgba(212, 160, 23, 0.4)'}`,
                      }}
                    >
                      {isStudent ? '🎓 Law Student' : '⚖️ Practicing Advocate'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <button
                    type="button"
                    onClick={handleRoleToggle}
                    disabled={switching}
                    className="header-dropdown-item"
                    style={{ color: 'var(--accent-hover)' }}
                  >
                    <Icon name="switch" style={{ width: 15, height: 15 }} />
                    <span>{isStudent ? 'Switch to Advocate View' : 'Switch to Student View'}</span>
                  </button>

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
              </div>
            )}
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
