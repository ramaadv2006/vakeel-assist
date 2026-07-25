import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useFlash } from '../context/FlashContext';
import { useStaggeredEntry } from '../hooks/useStaggeredEntry';

export default function ForgotPassword() {
  const addFlash = useFlash();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState(null);

  useEffect(() => {
    document.body.classList.add('auth-page-bg');
    return () => document.body.classList.remove('auth-page-bg');
  }, []);
  useStaggeredEntry();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      addFlash('Please enter your registered email address.', 'error');
      return;
    }
    setLoading(true);
    try {
      const data = await api.post('/auth/forgot-password', { email });
      addFlash(data.message, 'success');
      if (data.reset_token) {
        setResetLink(`/reset-password/${data.reset_token}`);
      }
    } catch (err) {
      addFlash(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="form-header staggered-entry">
        <h2>Forgot Password</h2>
        <p>Enter your registered email address to generate a password reset link</p>
      </div>

      <form className="card-form" onSubmit={handleSubmit}>
        <div className="form-group floating-group staggered-entry">
          <input type="email" id="email" required placeholder=" " value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="email">Email Address</label>
        </div>
        <button type="submit" className={`btn-submit staggered-entry${loading ? ' btn-loading' : ''}`}>Generate Reset Link</button>
      </form>

      {resetLink && (
        <div className="card-info staggered-entry" style={{ marginTop: 18 }}>
          No email delivery is configured for this project, so here is your reset link directly:{' '}
          <Link to={resetLink}>{window.location.origin}{resetLink}</Link>
        </div>
      )}

      <div className="auth-footer staggered-entry" style={{ marginTop: 18 }}>
        Remembered your password? <Link to="/login">Back to Login</Link>
      </div>
    </div>
  );
}
