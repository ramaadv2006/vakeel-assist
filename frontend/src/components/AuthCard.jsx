import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';
import { supabase } from '../api/supabaseClient';
import { useCursorGlow } from '../hooks/useCursorGlow';
import { useTilt } from '../hooks/useTilt';
import { useStaggeredEntry } from '../hooks/useStaggeredEntry';
import Icon from './Icon';

function PasswordToggle({ shown, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{ position: 'absolute', right: 10, top: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 0, outline: 'none' }}
      title="Toggle Password Visibility"
    >
      <svg className="icon-svg" viewBox="0 0 24 24" style={{ width: 20, height: 20, strokeWidth: 2, fill: 'none', stroke: 'currentColor' }}>
        {shown ? (
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
  );
}

// Auth screens - Login, Signup, and Forgot Password - live in one shared
// component mounted at all three routes so React Router re-renders instead
// of unmount/remounting when navigating between them (same component
// reference at the same tree position). That's what lets the flip-card
// transform animate smoothly across the URL change instead of jump-cutting.
export default function AuthCard() {
  const { login, signup } = useAuth();
  const addFlash = useFlash();
  const navigate = useNavigate();
  const location = useLocation();

  const mode = location.pathname === '/signup' ? 'signup'
    : location.pathname === '/forgot-password' ? 'forgot'
      : 'login';
  const isFlipped = mode !== 'login';

  const { ref: frontGlowRef, onMouseMove: onFrontGlowMove } = useCursorGlow();
  const { ref: frontTiltRef, onMouseMove: onFrontTiltMove, onMouseLeave: onFrontTiltLeave } = useTilt();
  const setFrontCardRef = (node) => { frontGlowRef.current = node; frontTiltRef.current = node; };
  const handleFrontMouseMove = (e) => { onFrontGlowMove(e); onFrontTiltMove(e); };

  const { ref: backGlowRef, onMouseMove: onBackGlowMove } = useCursorGlow();
  const { ref: backTiltRef, onMouseMove: onBackTiltMove, onMouseLeave: onBackTiltLeave } = useTilt();
  const setBackCardRef = (node) => { backGlowRef.current = node; backTiltRef.current = node; };
  const handleBackMouseMove = (e) => { onBackGlowMove(e); onBackTiltMove(e); };

  useEffect(() => {
    document.body.classList.add('auth-page-bg');
    return () => document.body.classList.remove('auth-page-bg');
  }, []);
  useStaggeredEntry();

  // --- Login ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const advocate = await login(loginEmail, loginPassword);
      addFlash(`Welcome back, ${advocate.name}!`, 'success');
      const dest = location.state?.from?.pathname || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      addFlash(err.message, 'error');
      setLoginLoading(false);
    }
  };

  // --- Signup ---
  const [signupForm, setSignupForm] = useState({ name: '', email: '', phone: '', bar_council_number: '', password: '' });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const updateSignup = (field) => (e) => setSignupForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupLoading(true);
    try {
      const result = await signup(signupForm);
      if (result.confirmationRequired) {
        addFlash('Account created! Check your email for a confirmation link, then log in.', 'success');
        navigate('/login', { replace: true });
      } else {
        addFlash(`Welcome to Advo Buddy, ${result.advocate.name}!`, 'success');
        navigate('/', { replace: true });
      }
    } catch (err) {
      addFlash(err.message, 'error');
      setSignupLoading(false);
    }
  };

  // --- Forgot password ---
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      addFlash('Please enter your registered email address.', 'error');
      return;
    }
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      addFlash('If an account with that email exists, a password reset link has been sent.', 'success');
      setForgotSent(true);
    } catch (err) {
      addFlash(err.message, 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-container login-animated" style={{ maxWidth: 520 }}>
      {/* Asymmetric squircle clip path for the glass login/signup card - defined
          once here with clipPathUnits="objectBoundingBox" so it scales with the
          card's actual rendered size (a plain clip-path path() with pixel
          coordinates wouldn't be responsive). Corner "radii" are fractions of
          the card's width/height: huge top-left sweep, tiny top-right, large
          bottom-right, medium bottom-left - true superellipse-style continuous
          curves rather than circular border-radius arcs. */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <clipPath id="authSquircle" clipPathUnits="objectBoundingBox">
            <path d="M 0,0.38 C 0,0.152 0.152,0 0.38,0 L 0.97,0 C 0.988,0 1,0.012 1,0.03 L 1,0.72 C 1,0.888 0.888,1 0.72,1 L 0.15,1 C 0.06,1 0,0.94 0,0.85 L 0,0.38 Z" />
          </clipPath>
        </defs>
      </svg>
      <div className="brand-logo-container staggered-entry">
        <div className="brand-logo-glow"></div>
        <svg className="brand-logo-svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2v20M17 7l-5-2-5 2M17 17l-5-2-5 2M4 7c0-2 2-3 4-3s4 1 4 3-2 3-4 3-4-1-4-3zm10 0c0-2 2-3 4-3s4 1 4 3-2 3-4 3-4-1-4-3zM3 21h18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className={`flip-card${isFlipped ? ' is-flipped' : ''}`}>
        <div className="flip-face flip-face-front" inert={isFlipped}>
          <div className="form-header staggered-entry">
            <h2>Welcome Back</h2>
            <p>Log in to manage your case diary and schedules</p>
          </div>

          <form
            className="card-form tilt-card"
            id="login-form"
            onSubmit={handleLoginSubmit}
            ref={setFrontCardRef}
            onMouseMove={handleFrontMouseMove}
            onMouseLeave={onFrontTiltLeave}
          >
            <div className="form-group floating-group has-icon staggered-entry" style={{ position: 'relative' }}>
              <input type="email" id="email" required placeholder=" " value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
              <Icon name="mail" className="field-icon" />
              <label htmlFor="email">Email Address</label>
            </div>
            <div className="form-group floating-group has-icon staggered-entry" style={{ position: 'relative' }}>
              <input type={showLoginPassword ? 'text' : 'password'} id="password" required placeholder=" " value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              <Icon name="lock" className="field-icon" />
              <label htmlFor="password">Password</label>
              <PasswordToggle shown={showLoginPassword} onToggle={() => setShowLoginPassword((v) => !v)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14, marginTop: -6 }} className="staggered-entry">
              <Link to="/forgot-password" style={{ fontSize: 12.5, color: 'var(--accent-hover)', fontWeight: 600, textDecoration: 'none' }}>Forgot Password?</Link>
            </div>
            <button type="submit" className={`btn-submit staggered-entry${loginLoading ? ' btn-loading' : ''}`}>Log In</button>
          </form>

          <div className="auth-footer staggered-entry">
            New here? <Link to="/signup">Create an account</Link> | <Link to="/forgot-password">Forgot Password?</Link>
          </div>
        </div>

        <div className="flip-face flip-face-back" inert={!isFlipped}>
          {mode === 'signup' ? (
            <>
              <div className="form-header">
                <h2>Create Your Account</h2>
                <p>Join fellow advocates already saving time with Advo Buddy</p>
              </div>

              <form
                className="card-form tilt-card"
                onSubmit={handleSignupSubmit}
                ref={setBackCardRef}
                onMouseMove={handleBackMouseMove}
                onMouseLeave={onBackTiltLeave}
              >
                <div className="form-group floating-group has-icon" style={{ position: 'relative' }}>
                  <input type="text" id="name" required placeholder=" " value={signupForm.name} onChange={updateSignup('name')} />
                  <Icon name="user" className="field-icon" />
                  <label htmlFor="name">Full Name *</label>
                </div>
                <div className="form-group floating-group has-icon" style={{ position: 'relative' }}>
                  <input type="email" id="signup-email" required placeholder=" " value={signupForm.email} onChange={updateSignup('email')} />
                  <Icon name="mail" className="field-icon" />
                  <label htmlFor="signup-email">Email Address *</label>
                </div>
                <div className="form-row">
                  <div className="form-group floating-group has-icon" style={{ position: 'relative' }}>
                    <input type="tel" id="phone" placeholder=" " value={signupForm.phone} onChange={updateSignup('phone')} />
                    <Icon name="phone" className="field-icon" />
                    <label htmlFor="phone">Phone Number</label>
                  </div>
                  <div className="form-group floating-group has-icon" style={{ position: 'relative' }}>
                    <input type="text" id="bar_council_number" placeholder=" " value={signupForm.bar_council_number} onChange={updateSignup('bar_council_number')} />
                    <Icon name="case" className="field-icon" />
                    <label htmlFor="bar_council_number">Bar Enrollment No.</label>
                  </div>
                </div>
                <div className="form-group floating-group has-icon" style={{ position: 'relative' }}>
                  <input type={showSignupPassword ? 'text' : 'password'} id="signup-password" required minLength={6} placeholder=" " value={signupForm.password} onChange={updateSignup('password')} />
                  <Icon name="lock" className="field-icon" />
                  <label htmlFor="signup-password">Password *</label>
                  <PasswordToggle shown={showSignupPassword} onToggle={() => setShowSignupPassword((v) => !v)} />
                </div>
                <button type="submit" className={`btn-submit${signupLoading ? ' btn-loading' : ''}`}>Create Account</button>
              </form>

              <div className="auth-footer">
                Already have an account? <Link to="/login">Log in</Link>
              </div>
            </>
          ) : (
            <>
              <div className="form-header">
                <h2>Forgot Password</h2>
                <p>Enter your registered email address to generate a password reset link</p>
              </div>

              <form
                className="card-form tilt-card"
                onSubmit={handleForgotSubmit}
                ref={setBackCardRef}
                onMouseMove={handleBackMouseMove}
                onMouseLeave={onBackTiltLeave}
              >
                <div className="form-group floating-group has-icon" style={{ position: 'relative' }}>
                  <input type="email" id="forgot-email" required placeholder=" " value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
                  <Icon name="mail" className="field-icon" />
                  <label htmlFor="forgot-email">Email Address</label>
                </div>
                <button type="submit" className={`btn-submit${forgotLoading ? ' btn-loading' : ''}`}>Send Reset Link</button>
              </form>

              {forgotSent && (
                <div className="card-info" style={{ marginTop: 18 }}>
                  Check your email for a password reset link.
                </div>
              )}

              <div className="auth-footer" style={{ marginTop: 18 }}>
                Remembered your password? <Link to="/login">Back to Login</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
