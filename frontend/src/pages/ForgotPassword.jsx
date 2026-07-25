import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { useFlash } from '../context/FlashContext';
import { useStaggeredEntry } from '../hooks/useStaggeredEntry';

export default function ForgotPassword() {
  const addFlash = useFlash();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      addFlash('If an account with that email exists, a password reset link has been sent.', 'success');
      setSent(true);
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
        <button type="submit" className={`btn-submit staggered-entry${loading ? ' btn-loading' : ''}`}>Send Reset Link</button>
      </form>

      {sent && (
        <div className="card-info staggered-entry" style={{ marginTop: 18 }}>
          Check your email for a password reset link.
        </div>
      )}

      <div className="auth-footer staggered-entry" style={{ marginTop: 18 }}>
        Remembered your password? <Link to="/login">Back to Login</Link>
      </div>
    </div>
  );
}
