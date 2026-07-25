import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';
import { useCursorGlow } from '../hooks/useCursorGlow';
import { useTilt } from '../hooks/useTilt';
import { useStaggeredEntry } from '../hooks/useStaggeredEntry';

export default function Login() {
  const { login } = useAuth();
  const addFlash = useFlash();
  const navigate = useNavigate();
  const location = useLocation();
  const { ref: glowRef, onMouseMove: onGlowMove } = useCursorGlow();
  const { ref: tiltRef, onMouseMove: onTiltMove, onMouseLeave: onTiltLeave } = useTilt();
  const setCardRef = (node) => {
    glowRef.current = node;
    tiltRef.current = node;
  };
  const handleCardMouseMove = (e) => {
    onGlowMove(e);
    onTiltMove(e);
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add('auth-page-bg');
    return () => document.body.classList.remove('auth-page-bg');
  }, []);
  useStaggeredEntry();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const advocate = await login(email, password);
      addFlash(`Welcome back, ${advocate.name}!`, 'success');
      const dest = location.state?.from?.pathname || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      addFlash(err.message, 'error');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container login-animated">
      <div className="brand-logo-container staggered-entry">
        <div className="brand-logo-glow"></div>
        <svg className="brand-logo-svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2v20M17 7l-5-2-5 2M17 17l-5-2-5 2M4 7c0-2 2-3 4-3s4 1 4 3-2 3-4 3-4-1-4-3zm10 0c0-2 2-3 4-3s4 1 4 3-2 3-4 3-4-1-4-3zM3 21h18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="form-header staggered-entry">
        <h2>Welcome Back</h2>
        <p>Log in to manage your case diary and schedules</p>
      </div>

      <form
        className="card-form tilt-card"
        id="login-form"
        onSubmit={handleSubmit}
        ref={setCardRef}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={onTiltLeave}
      >
        <div className="form-group floating-group staggered-entry">
          <input type="email" id="email" required placeholder=" " value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="email">Email Address</label>
        </div>
        <div className="form-group floating-group staggered-entry" style={{ position: 'relative' }}>
          <input type={showPassword ? 'text' : 'password'} id="password" required placeholder=" " value={password} onChange={(e) => setPassword(e.target.value)} />
          <label htmlFor="password">Password</label>
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            style={{ position: 'absolute', right: 10, top: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 0, outline: 'none' }}
            title="Toggle Password Visibility"
          >
            <svg className="icon-svg" viewBox="0 0 24 24" style={{ width: 20, height: 20, strokeWidth: 2, fill: 'none', stroke: 'currentColor' }}>
              {showPassword ? (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </>
              ) : (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </>
              )}
            </svg>
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14, marginTop: -6 }} className="staggered-entry">
          <Link to="/forgot-password" style={{ fontSize: 12.5, color: 'var(--accent-hover)', fontWeight: 600, textDecoration: 'none' }}>Forgot Password?</Link>
        </div>
        <button type="submit" className={`btn-submit staggered-entry${loading ? ' btn-loading' : ''}`}>Log In</button>
      </form>

      <div className="auth-footer staggered-entry">
        New here? <Link to="/signup">Create an account</Link> | <Link to="/forgot-password">Forgot Password?</Link>
      </div>
    </div>
  );
}
