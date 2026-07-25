import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';
import { useStaggeredEntry } from '../hooks/useStaggeredEntry';

export default function Signup() {
  const { signup } = useAuth();
  const addFlash = useFlash();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', phone: '', bar_council_number: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add('auth-page-bg');
    return () => document.body.classList.remove('auth-page-bg');
  }, []);
  useStaggeredEntry();

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signup(form);
      if (result.confirmationRequired) {
        addFlash('Account created! Check your email for a confirmation link, then log in.', 'success');
        navigate('/login', { replace: true });
      } else {
        addFlash(`Welcome to Advo Buddy, ${result.advocate.name}!`, 'success');
        navigate('/', { replace: true });
      }
    } catch (err) {
      addFlash(err.message, 'error');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: 520 }}>
      <div className="form-header staggered-entry">
        <h2>Create Your Account</h2>
        <p>Join fellow advocates already saving time with Advo Buddy</p>
      </div>

      <form className="card-form" onSubmit={handleSubmit}>
        <div className="form-group floating-group staggered-entry">
          <input type="text" id="name" required placeholder=" " value={form.name} onChange={update('name')} />
          <label htmlFor="name">Full Name *</label>
        </div>
        <div className="form-group floating-group staggered-entry">
          <input type="email" id="email" required placeholder=" " value={form.email} onChange={update('email')} />
          <label htmlFor="email">Email Address *</label>
        </div>
        <div className="form-row staggered-entry">
          <div className="form-group floating-group">
            <input type="tel" id="phone" placeholder=" " value={form.phone} onChange={update('phone')} />
            <label htmlFor="phone">Phone Number</label>
          </div>
          <div className="form-group floating-group">
            <input type="text" id="bar_council_number" placeholder=" " value={form.bar_council_number} onChange={update('bar_council_number')} />
            <label htmlFor="bar_council_number">Bar Enrollment No.</label>
          </div>
        </div>
        <div className="form-group floating-group staggered-entry" style={{ position: 'relative' }}>
          <input type={showPassword ? 'text' : 'password'} id="password" required minLength={6} placeholder=" " value={form.password} onChange={update('password')} />
          <label htmlFor="password">Password *</label>
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
        <button type="submit" className={`btn-submit staggered-entry${loading ? ' btn-loading' : ''}`}>Create Account</button>
      </form>

      <div className="auth-footer staggered-entry">
        Already have an account? <Link to="/login">Log in</Link>
      </div>
    </div>
  );
}
