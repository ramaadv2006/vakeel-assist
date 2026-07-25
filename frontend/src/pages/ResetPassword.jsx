import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useFlash } from '../context/FlashContext';
import { useStaggeredEntry } from '../hooks/useStaggeredEntry';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const addFlash = useFlash();

  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState(null);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add('auth-page-bg');
    return () => document.body.classList.remove('auth-page-bg');
  }, []);
  useStaggeredEntry([checking]);

  useEffect(() => {
    api.get(`/auth/reset-password/${token}`)
      .then((data) => setEmail(data.email))
      .catch(() => setInvalid(true))
      .finally(() => setChecking(false));
  }, [token]);

  if (checking) return null;

  if (invalid) {
    return (
      <div className="auth-container">
        <div className="form-header staggered-entry">
          <h2>Reset Password</h2>
          <p>The password reset link is invalid or has expired.</p>
        </div>
        <div className="auth-footer staggered-entry">
          <Link to="/forgot-password">Request a new reset link</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      addFlash('Password must be at least 6 characters.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      addFlash('Passwords do not match.', 'error');
      return;
    }
    setLoading(true);
    try {
      const data = await api.post(`/auth/reset-password/${token}`, { password, confirm_password: confirmPassword });
      addFlash(data.message, 'success');
      navigate('/login', { replace: true });
    } catch (err) {
      addFlash(err.message, 'error');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="form-header staggered-entry">
        <h2>Reset Password</h2>
        <p>Set a new password for account <strong>{email}</strong></p>
      </div>

      <form className="card-form" onSubmit={handleSubmit}>
        <div className="form-group floating-group staggered-entry" style={{ position: 'relative' }}>
          <input type={showPassword ? 'text' : 'password'} id="password" required minLength={6} placeholder=" " value={password} onChange={(e) => setPassword(e.target.value)} />
          <label htmlFor="password">New Password (min 6 chars)</label>
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            style={{ position: 'absolute', right: 10, top: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', outline: 'none' }}
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

        <div className="form-group floating-group staggered-entry">
          <input type="password" id="confirm_password" required minLength={6} placeholder=" " value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <label htmlFor="confirm_password">Confirm New Password</label>
        </div>

        <button type="submit" className={`btn-submit staggered-entry${loading ? ' btn-loading' : ''}`}>Update Password</button>
      </form>

      <div className="auth-footer staggered-entry" style={{ marginTop: 18 }}>
        <Link to="/login">Back to Login</Link>
      </div>
    </div>
  );
}
