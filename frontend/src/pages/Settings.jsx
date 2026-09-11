import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';
import Icon from '../components/Icon';
import Skeleton from '../components/Skeleton';

const REMINDER_DAYS = [1, 2, 3, 5, 7];

export default function Settings() {
  const { advocate, setAdvocate } = useAuth();
  const addFlash = useFlash();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: advocate?.name || '',
    email: advocate?.email || '',
    phone: advocate?.phone || '',
    role: 'advocate',
    bar_council_number: advocate?.bar_council_number || '',
    office_address: advocate?.office_address || '',
    specialization: advocate?.specialization || '',
    reminder_method: advocate?.reminder_method || 'none',
    reminder_days_before: advocate?.reminder_days_before || 1,
  });
  const [preview, setPreview] = useState(null);
  const [avatarError, setAvatarError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (advocate) {
      setForm({
        name: advocate.name || '',
        email: advocate.email || '',
        phone: advocate.phone || '',
        role: advocate.role || 'advocate',
        bar_council_number: advocate.bar_council_number || '',
        office_address: advocate.office_address || '',
        specialization: advocate.specialization || '',
        reminder_method: advocate.reminder_method || 'none',
        reminder_days_before: advocate.reminder_days_before || 1,
      });
    }
  }, [advocate]);

  useEffect(() => {
    setAvatarError(false);
  }, [preview, advocate?.avatar_url]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarError(false);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    const data = new FormData();
    data.append('profile_image', file);
    api.post('/settings/avatar', data, { isForm: true }).then((res) => {
      setAdvocate(res.advocate);
      addFlash('Profile photo updated!', 'success');
    }).catch((err) => addFlash(err.message, 'error'));
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Remove your profile photo?')) return;
    const res = await api.del('/settings/avatar');
    setAdvocate(res.advocate);
    setPreview(null);
    addFlash(res.message, 'success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = form.reminder_method;
    const phone = form.phone.trim();
    if ((method === 'whatsapp' || method === 'sms') && (!phone || phone.length < 10 || !/^\d+$/.test(phone))) {
      setPhoneError(true);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      addFlash('Valid 10-digit phone number is required when WhatsApp or SMS reminders are enabled!', 'error');
      return;
    }
    setPhoneError(false);
    try {
      const res = await api.put('/settings', form);
      setAdvocate(res.advocate);
      addFlash(res.message, 'success');
    } catch (err) {
      addFlash(err.message, 'error');
    }
  };

  if (!advocate) {
    return (
      <div className="form-container" style={{ maxWidth: 780 }}>
        <Skeleton count={2} rows={3} widths={['40%', '80%']} />
      </div>
    );
  }

  const avatarUrl = preview || advocate?.avatar_url;

  const reminderChannels = [
    { id: 'none', label: 'Off', icon: 'settings', desc: 'No alerts' },
    { id: 'whatsapp', label: 'WhatsApp', icon: 'phone', desc: 'Instant message' },
    { id: 'sms', label: 'SMS Text', icon: 'bell', desc: 'Mobile text' },
    { id: 'email', label: 'Email', icon: 'case', desc: 'Chambers inbox' },
  ];

  return (
    <div className="form-container" style={{ maxWidth: 780 }}>
      {/* Top Hero Navigation */}
      <div className="page-hero-nav">
        <Link to="/" className="btn-back-dashboard">
          <span>←</span>
          <span>Back to Dashboard</span>
        </Link>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</Link>
          <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Settings</span>
        </div>
      </div>

      <div className="form-header staggered-entry">
        <h2>Advocate Profile & Settings</h2>
        <p>Manage your professional credentials, chamber details, profile photo, and hearing alert preferences</p>
      </div>

      <div className="card-form staggered-entry" style={{ textAlign: 'center', marginBottom: 24, padding: 26 }}>
        <div
          style={{
            position: 'relative', width: 110, height: 110, borderRadius: '50%', margin: '0 auto 16px auto',
            border: '3px solid var(--accent)', boxShadow: '0 8px 24px rgba(184, 147, 94, 0.25)', overflow: 'hidden',
            background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {avatarUrl && !avatarError ? (
            <img
              src={avatarUrl}
              alt="User Avatar"
              onError={() => setAvatarError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: 40, fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', fontFamily: "'Lora', serif" }}>
              {advocate?.name ? advocate.name[0] : 'A'}
            </span>
          )}
        </div>

        <div style={{ fontFamily: "'Lora', serif", fontSize: 22, fontWeight: 700, color: 'var(--text-dark)' }}>
          {advocate?.name || 'Advocate'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-main)', marginTop: 4 }}>
          {advocate?.bar_council_number ? <>Enrollment No: <strong>{advocate.bar_council_number}</strong></> : 'Advocate & Legal Counsel'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--primary)', fontSize: 12, fontWeight: 600 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
            <span>Verified Chambers Counsel</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 18 }}>
          <label className="btn-change-photo" style={{ cursor: 'pointer' }}>
            <Icon name="camera" />
            Change Photo
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          </label>
          {advocate?.avatar_url && (
            <button type="button" onClick={handleRemoveAvatar} style={{ background: 'none', border: '1px solid var(--border-card)', color: 'var(--danger)', padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Remove
            </button>
          )}
        </div>
      </div>

      <form className={`card-form staggered-entry${shake ? ' shake-error' : ''}`} onSubmit={handleSubmit} noValidate>
        <div style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 700, color: 'var(--text-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="user" style={{ color: 'var(--accent)' }} />
          Personal & Professional Info
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input type="text" id="name" required value={form.name} onChange={update('name')} placeholder="e.g. Adv. M. Subramanian" />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address (Login ID) *</label>
            <input type="email" id="email" required value={form.email} onChange={update('email')} placeholder="e.g. advocate@chambers.in" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="phone">Phone Number (10 digits)</label>
            <input type="tel" id="phone" value={form.phone} onChange={update('phone')} placeholder="e.g. 9876543210" style={phoneError ? { borderColor: 'var(--danger)' } : undefined} />
          </div>
          <div className="form-group">
            <label htmlFor="bar_council_number">Bar Council Enrollment Number</label>
            <input type="text" id="bar_council_number" value={form.bar_council_number} onChange={update('bar_council_number')} placeholder="e.g. MS/1234/2018" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="office_address">Office / Chamber Address</label>
            <input type="text" id="office_address" value={form.office_address} onChange={update('office_address')} placeholder="e.g. Chamber 204, High Court Buildings, Chennai" />
          </div>
          <div className="form-group">
            <label htmlFor="specialization">Practice Area / Specialization</label>
            <input type="text" id="specialization" value={form.specialization} onChange={update('specialization')} placeholder="e.g. Civil Litigation, Constitutional, Criminal" />
          </div>
        </div>

        <div style={{ margin: '10px 0 0 0', borderBottom: '1px dashed var(--border-card)', paddingBottom: 10 }}>
          <div style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="bell" style={{ color: 'var(--accent)' }} />
            Notification & Alert Preferences
          </div>
        </div>

        {/* Visual Channel Selector */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
            Alert Delivery Channel
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            {reminderChannels.map((ch) => {
              const isActive = form.reminder_method === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, reminder_method: ch.id }))}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--border-card)'}`,
                    background: isActive ? 'var(--accent-bg)' : 'var(--bg-app)',
                    color: isActive ? 'var(--primary)' : 'var(--text-dark)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon name={ch.icon} style={{ width: 18, height: 18, stroke: isActive ? 'var(--accent)' : 'var(--text-muted)' }} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{ch.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ch.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="reminder_days_before">Alert Schedule</label>
            <select id="reminder_days_before" value={form.reminder_days_before} onChange={update('reminder_days_before')}>
              {REMINDER_DAYS.map((d) => (
                <option key={d} value={d}>{d} day{d > 1 ? 's' : ''} before deadline</option>
              ))}
            </select>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.015, y: -2 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="btn-submit"
          style={{ marginTop: 6 }}
        >
          Save Profile & Preferences
        </motion.button>
      </form>

      {/* Legal & Compliance Section */}
      <div className="card-form staggered-entry" style={{ marginTop: 24, padding: 20 }}>
        <div style={{ fontFamily: "'Lora', serif", fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Icon name="court" style={{ color: 'var(--accent)' }} />
          Legal &amp; Data Protection Compliance
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5, margin: '0 0 14px 0' }}>
          Your data is processed in accordance with the <em>Digital Personal Data Protection Act, 2023</em> and Bar Council ethical standards. All chamber files, briefs, and client records are encrypted and strictly isolated to your account.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            to="/terms"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12.5,
              fontWeight: 600,
              textDecoration: 'none',
              color: 'var(--text-dark)',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Icon name="case" style={{ width: 13, height: 13 }} />
            Terms of Service
          </Link>
          <Link
            to="/privacy"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12.5,
              fontWeight: 600,
              textDecoration: 'none',
              color: 'var(--text-dark)',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Icon name="settings" style={{ width: 13, height: 13 }} />
            Privacy Policy
          </Link>
          <Link
            to="/about"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12.5,
              fontWeight: 600,
              textDecoration: 'none',
              color: 'var(--text-dark)',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Icon name="court" style={{ width: 13, height: 13 }} />
            About Us
          </Link>
          <Link
            to="/contact"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12.5,
              fontWeight: 600,
              textDecoration: 'none',
              color: 'var(--text-dark)',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Icon name="phone" style={{ width: 13, height: 13 }} />
            Contact Support
          </Link>
          <Link
            to="/refund-policy"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12.5,
              fontWeight: 600,
              textDecoration: 'none',
              color: 'var(--text-dark)',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Icon name="billing" style={{ width: 13, height: 13 }} />
            Refund Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
