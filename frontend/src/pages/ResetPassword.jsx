import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { useFlash } from '../context/FlashContext';
import AuthShell, { PasswordToggle, StrengthMeter, SubmitButton } from '../components/AuthShell';
import Icon from '../components/Icon';
import { SkeletonCard } from '../components/Skeleton';
import { useStaggeredEntry } from '../hooks/useStaggeredEntry';

export default function ResetPassword() {
  const navigate = useNavigate();
  const addFlash = useFlash();

  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // AuthShell owns the auth-page-bg body class.
  useStaggeredEntry([ready]);

  // Supabase parses the recovery link's URL hash automatically and fires
  // a PASSWORD_RECOVERY auth event once it's established a temporary
  // session for the reset - that's our signal the form is safe to show.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (ready) return;
    const timeout = setTimeout(() => setInvalid(true), 4000);
    return () => clearTimeout(timeout);
  }, [ready]);

  if (invalid) {
    return (
      <AuthShell>
        <div className="auth-heading staggered-entry">
          <h2>Reset password</h2>
          <p>The password reset link is invalid or has expired.</p>
        </div>
        <div className="auth-footer staggered-entry">
          <Link to="/forgot-password">Request a new reset link</Link>
        </div>
      </AuthShell>
    );
  }

  // Blank until the recovery session lands (up to the 4s timeout above),
  // so shimmer the form's shape rather than showing an empty page.
  if (!ready) {
    return (
      <AuthShell>
        <div className="auth-heading staggered-entry">
          <h2>Reset password</h2>
          <p>Verifying your reset link…</p>
        </div>
        <SkeletonCard rows={3} widths={['100%', '100%', '55%']} />
      </AuthShell>
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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      addFlash('Your password has been reset successfully! You can now log in.', 'success');
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      addFlash(err.message, 'error');
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="auth-heading staggered-entry">
        <h2>Reset password</h2>
        <p>Set a new password for your account.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group floating-group has-icon staggered-entry">
          <input type={showPassword ? 'text' : 'password'} id="password" required minLength={6} autoComplete="new-password" placeholder=" " value={password} onChange={(e) => setPassword(e.target.value)} />
          <Icon name="lock" className="field-icon" />
          <label htmlFor="password">New password (min 6 chars)</label>
          <PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />
        </div>

        <StrengthMeter value={password} />

        <div className="form-group floating-group has-icon staggered-entry">
          <input type="password" id="confirm_password" required minLength={6} autoComplete="new-password" placeholder=" " value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <Icon name="lock" className="field-icon" />
          <label htmlFor="confirm_password">Confirm new password</label>
        </div>

        <SubmitButton loading={loading}>Update password</SubmitButton>
      </form>

      <div className="auth-footer staggered-entry">
        <Link to="/login">Back to login</Link>
      </div>
    </AuthShell>
  );
}
