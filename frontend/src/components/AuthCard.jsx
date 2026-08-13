import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';
import { supabase } from '../api/supabaseClient';
import AuthShell, { PasswordToggle, StrengthMeter, SubmitButton } from './AuthShell';
import Icon from './Icon';

// Login, Signup and Forgot Password share this one component across all
// three routes, so React Router re-renders rather than remounting it and
// the typed-in state survives a mode switch. The inner .auth-swap div is
// keyed on the mode, which replays its enter animation on each change.
export default function AuthCard() {
  const { login, signup } = useAuth();
  const addFlash = useFlash();
  const navigate = useNavigate();
  const location = useLocation();

  const mode = location.pathname === '/signup' ? 'signup'
    : location.pathname === '/forgot-password' ? 'forgot'
      : 'login';

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
    <AuthShell>
      {/* Real navigation, not a tablist — each side is its own route, so
          aria-current is the correct signal rather than tab/aria-selected. */}
      <nav className="auth-tabs" aria-label="Account access">
        <Link
          to="/login"
          aria-current={mode !== 'signup' ? 'page' : undefined}
          className={`auth-tab${mode !== 'signup' ? ' is-active' : ''}`}
        >
          Log in
        </Link>
        <Link
          to="/signup"
          aria-current={mode === 'signup' ? 'page' : undefined}
          className={`auth-tab${mode === 'signup' ? ' is-active' : ''}`}
        >
          Sign up
        </Link>
        <span className={`auth-tab-thumb${mode === 'signup' ? ' is-right' : ''}`} aria-hidden="true" />
      </nav>

      <div className="auth-swap" key={mode}>
        {mode === 'login' && (
          <>
            <div className="auth-heading">
              <h2>Welcome back</h2>
              <p>Log in to manage your case diary and schedules.</p>
            </div>

            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <div className="form-group floating-group has-icon">
                <input type="email" id="email" required autoComplete="email" placeholder=" " value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                <Icon name="mail" className="field-icon" />
                <label htmlFor="email">Email address</label>
              </div>

              <div className="form-group floating-group has-icon">
                <input type={showLoginPassword ? 'text' : 'password'} id="password" required autoComplete="current-password" placeholder=" " value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                <Icon name="lock" className="field-icon" />
                <label htmlFor="password">Password</label>
                <PasswordToggle shown={showLoginPassword} onToggle={() => setShowLoginPassword((v) => !v)} />
              </div>

              <div className="auth-row-end">
                <Link to="/forgot-password" className="auth-link-sm">Forgot password?</Link>
              </div>

              <SubmitButton loading={loginLoading}>Log in</SubmitButton>
            </form>

            <div className="auth-footer">
              New here? <Link to="/signup">Create an account</Link>
            </div>
          </>
        )}

        {mode === 'signup' && (
          <>
            <div className="auth-heading">
              <h2>Create your account</h2>
              <p>Join fellow advocates already saving time with Advo Buddy.</p>
            </div>

            <form className="auth-form" onSubmit={handleSignupSubmit}>
              <div className="form-group floating-group has-icon">
                <input type="text" id="name" required autoComplete="name" placeholder=" " value={signupForm.name} onChange={updateSignup('name')} />
                <Icon name="user" className="field-icon" />
                <label htmlFor="name">Full name *</label>
              </div>

              <div className="form-group floating-group has-icon">
                <input type="email" id="signup-email" required autoComplete="email" placeholder=" " value={signupForm.email} onChange={updateSignup('email')} />
                <Icon name="mail" className="field-icon" />
                <label htmlFor="signup-email">Email address *</label>
              </div>

              <div className="form-row">
                <div className="form-group floating-group has-icon">
                  <input type="tel" id="phone" autoComplete="tel" placeholder=" " value={signupForm.phone} onChange={updateSignup('phone')} />
                  <Icon name="phone" className="field-icon" />
                  <label htmlFor="phone">Phone number</label>
                </div>
                <div className="form-group floating-group has-icon">
                  <input type="text" id="bar_council_number" placeholder=" " value={signupForm.bar_council_number} onChange={updateSignup('bar_council_number')} />
                  <Icon name="case" className="field-icon" />
                  <label htmlFor="bar_council_number">Bar enrollment no.</label>
                </div>
              </div>

              <div className="form-group floating-group has-icon">
                <input type={showSignupPassword ? 'text' : 'password'} id="signup-password" required minLength={6} autoComplete="new-password" placeholder=" " value={signupForm.password} onChange={updateSignup('password')} />
                <Icon name="lock" className="field-icon" />
                <label htmlFor="signup-password">Password *</label>
                <PasswordToggle shown={showSignupPassword} onToggle={() => setShowSignupPassword((v) => !v)} />
              </div>

              <StrengthMeter value={signupForm.password} />

              <SubmitButton loading={signupLoading}>Create account</SubmitButton>
            </form>

            <div className="auth-footer">
              Already have an account? <Link to="/login">Log in</Link>
            </div>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <div className="auth-heading">
              <h2>Forgot password</h2>
              <p>Enter your registered email and we'll send you a reset link.</p>
            </div>

            <form className="auth-form" onSubmit={handleForgotSubmit}>
              <div className="form-group floating-group has-icon">
                <input type="email" id="forgot-email" required autoComplete="email" placeholder=" " value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
                <Icon name="mail" className="field-icon" />
                <label htmlFor="forgot-email">Email address</label>
              </div>

              <SubmitButton loading={forgotLoading}>Send reset link</SubmitButton>
            </form>

            {forgotSent && (
              <div className="auth-note">
                <Icon name="check" />
                <span>Check your email for a password reset link.</span>
              </div>
            )}

            <div className="auth-footer">
              Remembered your password? <Link to="/login">Back to login</Link>
            </div>
          </>
        )}
      </div>
    </AuthShell>
  );
}
