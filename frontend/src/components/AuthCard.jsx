import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';
import { supabase } from '../api/supabaseClient';
import AuthShell, { PasswordToggle, StrengthMeter, SubmitButton } from './AuthShell';
import FlashMessages from './FlashMessages';

export default function AuthCard() {
  const { login, signup } = useAuth();
  const addFlash = useFlash();
  const navigate = useNavigate();
  const location = useLocation();

  const isForgotPath = location.pathname === '/forgot-password';
  const isSignupPath = location.pathname === '/signup';

  const [mode, setMode] = useState(isSignupPath ? 'signup' : 'login');
  const [isFlipped, setIsFlipped] = useState(isForgotPath);

  // Synchronize state with route location
  useEffect(() => {
    if (location.pathname === '/forgot-password') {
      setIsFlipped(true);
    } else {
      setIsFlipped(false);
      if (location.pathname === '/signup') {
        setMode('signup');
      } else if (location.pathname === '/login') {
        setMode('login');
      }
    }
  }, [location.pathname]);

  // Flip Handlers
  const handleGoToForgot = (e) => {
    e.preventDefault();
    setIsFlipped(true);
    navigate('/forgot-password');
  };

  const handleBackToLogin = (e) => {
    e.preventDefault();
    setIsFlipped(false);
    navigate('/login');
  };

  // --- Login State ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const advocate = await login(loginEmail, loginPassword);
      addFlash(`Welcome back, ${advocate.name || 'Advocate'}!`, 'success');
      const dest = location.state?.from?.pathname || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      addFlash(err.message || 'Login failed. Please verify your credentials.', 'error');
      setLoginLoading(false);
    }
  };

  // --- Signup State ---
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    phone: '',
    bar_council_number: '',
    password: '',
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const updateSignup = (field) => (e) => setSignupForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupLoading(true);
    try {
      const result = await signup(signupForm);
      if (result.confirmationRequired) {
        addFlash('Account created! Please check your email for a confirmation link, then log in.', 'success');
        navigate('/login', { replace: true });
      } else {
        addFlash(`Welcome to AdvoBuddy, ${result.advocate?.name || 'Advocate'}!`, 'success');
        navigate('/', { replace: true });
      }
    } catch (err) {
      addFlash(err.message || 'Registration failed. Please check your information.', 'error');
      setSignupLoading(false);
    }
  };

  // --- Forgot Password State ---
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
      addFlash(err.message || 'Failed to send reset link.', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="auth-flip-card-wrapper">
        <div className={`auth-flip-card${isFlipped ? ' is-flipped' : ''}`}>
          
          {/* FRONT FACE: LOGIN / SIGNUP */}
          <div className="auth-card-face auth-card-front">
            <FlashMessages />

            {/* Top Gold Crest Shield Emblem */}
            <div className="auth-card-emblem-wrap">
              <div className="auth-card-emblem" aria-hidden="true">
                <span className="auth-emblem-ring" />
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M12 7v8M8 10h8M8 10l-2 3h4L8 10zm8 0l-2 3h4l-2-3z" />
                </svg>
              </div>
            </div>

            {/* Header text */}
            <div className="auth-card-header">
              <h2 className="auth-card-title">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="auth-card-desc">
                {mode === 'login'
                  ? 'Log in to manage your case diary and smart reminders.'
                  : 'Join thousands of advocates streamlining their legal practice.'}
              </p>
            </div>

            {/* Switcher tabs (Log in / Sign up) */}
            <div className="auth-tab-switch">
              <Link
                to="/login"
                onClick={() => setMode('login')}
                className={`auth-tab-btn${mode === 'login' ? ' is-active' : ''}`}
              >
                Log in
              </Link>
              <Link
                to="/signup"
                onClick={() => setMode('signup')}
                className={`auth-tab-btn${mode === 'signup' ? ' is-active' : ''}`}
              >
                Sign up
              </Link>
            </div>

            {/* Dynamic forms on Front */}
            <div className="auth-swap-container" key={mode}>
              {mode === 'login' ? (
                <form className="auth-form-body" onSubmit={handleLoginSubmit}>
                  <div className="auth-input-group">
                    <span className="auth-input-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      id="login-email"
                      className="auth-text-input"
                      required
                      autoComplete="email"
                      placeholder="Email address"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>

                  <div className="auth-input-group">
                    <span className="auth-input-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      id="login-password"
                      className="auth-text-input"
                      required
                      autoComplete="current-password"
                      placeholder="Password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                    <PasswordToggle shown={showLoginPassword} onToggle={() => setShowLoginPassword((v) => !v)} />
                  </div>

                  <div className="auth-actions-row">
                    <a href="/forgot-password" onClick={handleGoToForgot} className="auth-gold-link">
                      Forgot password?
                    </a>
                  </div>

                  <SubmitButton loading={loginLoading}>Log In</SubmitButton>

                  <div className="auth-alt-footer">
                    Don't have an account?{' '}
                    <Link to="/signup" onClick={() => setMode('signup')} className="auth-gold-link">
                      Sign up
                    </Link>
                  </div>
                </form>
              ) : (
                <form className="auth-form-body" onSubmit={handleSignupSubmit}>
                  <div className="auth-input-group">
                    <span className="auth-input-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      id="signup-name"
                      className="auth-text-input"
                      required
                      autoComplete="name"
                      placeholder="Full Name *"
                      value={signupForm.name}
                      onChange={updateSignup('name')}
                    />
                  </div>

                  <div className="auth-input-group">
                    <span className="auth-input-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      id="signup-email"
                      className="auth-text-input"
                      required
                      autoComplete="email"
                      placeholder="Email Address *"
                      value={signupForm.email}
                      onChange={updateSignup('email')}
                    />
                  </div>

                  <div className="auth-form-two-col">
                    <div className="auth-input-group">
                      <span className="auth-input-icon">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </span>
                      <input
                        type="tel"
                        id="signup-phone"
                        className="auth-text-input"
                        autoComplete="tel"
                        placeholder="Phone number"
                        value={signupForm.phone}
                        onChange={updateSignup('phone')}
                      />
                    </div>

                    <div className="auth-input-group">
                      <span className="auth-input-icon">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        id="signup-bar"
                        className="auth-text-input"
                        placeholder="Bar enrollment no."
                        value={signupForm.bar_council_number}
                        onChange={updateSignup('bar_council_number')}
                      />
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <span className="auth-input-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      id="signup-password"
                      className="auth-text-input"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Password (min 6 characters) *"
                      value={signupForm.password}
                      onChange={updateSignup('password')}
                    />
                    <PasswordToggle shown={showSignupPassword} onToggle={() => setShowSignupPassword((v) => !v)} />
                  </div>

                  <StrengthMeter value={signupForm.password} />

                  <SubmitButton loading={signupLoading}>Create Account</SubmitButton>

                  <div className="auth-alt-footer">
                    Already have an account?{' '}
                    <Link to="/login" onClick={() => setMode('login')} className="auth-gold-link">
                      Log in
                    </Link>
                  </div>
                </form>
              )}
            </div>

            {/* Trust Badges Footer */}
            <div className="auth-card-trust-footer">
              <div className="auth-trust-item">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>256-bit Encrypted</span>
              </div>
              <span className="auth-trust-divider">•</span>
              <div className="auth-trust-item">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Bar Council Compliant</span>
              </div>
            </div>
          </div>

          {/* BACK FACE: FORGOT PASSWORD */}
          <div className="auth-card-face auth-card-back">
            <FlashMessages />

            {/* Top Gold Crest Shield Emblem */}
            <div className="auth-card-emblem-wrap">
              <div className="auth-card-emblem" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M12 7v8M8 10h8M8 10l-2 3h4L8 10zm8 0l-2 3h4l-2-3z" />
                </svg>
              </div>
            </div>

            {/* Header text */}
            <div className="auth-card-header">
              <h2 className="auth-card-title">Reset your password</h2>
              <p className="auth-card-desc">
                Enter your registered email address and we'll send you a reset link.
              </p>
            </div>

            <form className="auth-form-body" onSubmit={handleForgotSubmit}>
              <div className="auth-input-group">
                <span className="auth-input-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  type="email"
                  id="forgot-email"
                  className="auth-text-input"
                  required
                  autoComplete="email"
                  placeholder="Enter your registered email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>

              <SubmitButton loading={forgotLoading}>Send Reset Link</SubmitButton>

              {forgotSent && (
                <div className="auth-feedback-box">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Password reset link sent! Please check your email inbox.</span>
                </div>
              )}

              <div className="auth-alt-footer">
                Remember your password?{' '}
                <a href="/login" onClick={handleBackToLogin} className="auth-gold-link">
                  Back to login
                </a>
              </div>
            </form>

            {/* Trust Badges Footer */}
            <div className="auth-card-trust-footer">
              <div className="auth-trust-item">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>256-bit Encrypted</span>
              </div>
              <span className="auth-trust-divider">•</span>
              <div className="auth-trust-item">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Bar Council Compliant</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AuthShell>
  );
}
