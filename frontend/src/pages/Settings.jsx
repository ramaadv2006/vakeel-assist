import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';
import Icon from '../components/Icon';

const REMINDER_DAYS = [1, 2, 3, 5, 7];

export default function Settings() {
  const { advocate, setAdvocate } = useAuth();
  const addFlash = useFlash();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: advocate.name || '',
    email: advocate.email || '',
    phone: advocate.phone || '',
    bar_council_number: advocate.bar_council_number || '',
    office_address: advocate.office_address || '',
    specialization: advocate.specialization || '',
    reminder_method: advocate.reminder_method || 'none',
    reminder_days_before: advocate.reminder_days_before || 1,
  });
  const [preview, setPreview] = useState(null);
  const [phoneError, setPhoneError] = useState(false);
  const [shake, setShake] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
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
    if (method !== 'none' && (!phone || phone.length < 10 || !/^\d+$/.test(phone))) {
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

  const avatarUrl = preview || advocate.avatar_url;

  return (
    <div className="form-container" style={{ maxWidth: 780 }}>
      <Link to="/" className="back-link staggered-entry">
        <Icon name="back" />
        Back to Dashboard
      </Link>

      <div className="form-header staggered-entry">
        <h2>Advocate Profile & Settings</h2>
        <p>Manage your professional credentials, chamber details, profile photo, and hearing alert preferences</p>
      </div>

      <div className="card-form staggered-entry" style={{ textAlign: 'center', marginBottom: 24, padding: 24 }}>
        <div
          style={{
            position: 'relative', width: 110, height: 110, borderRadius: '50%', margin: '0 auto 16px auto',
            border: '3px solid var(--accent)', boxShadow: 'var(--shadow-md)', overflow: 'hidden',
            background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Advocate Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 40, fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', fontFamily: "'Lora', serif" }}>
              {advocate.name ? advocate.name[0] : 'A'}
            </span>
          )}
        </div>

        <div style={{ fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 700, color: 'var(--text-dark)' }}>
          {advocate.name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-main)', marginTop: 2 }}>
          {advocate.bar_council_number ? <>Enrollment No: <strong>{advocate.bar_council_number}</strong></> : 'Advocate & Legal Counsel'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 10 }}>
          <label
            style={{ background: 'var(--accent-bg)', color: 'var(--accent-hover)', border: '1px solid var(--accent)', padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name="camera" />
            Change Photo
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          </label>
          {advocate.avatar_url && (
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

        <div className="form-row" style={{ marginTop: 16 }}>
          <div className="form-group">
            <label htmlFor="name">Full Name (with Advocate Prefix) *</label>
            <input type="text" id="name" required value={form.name} onChange={update('name')} placeholder="e.g. Adv. M. Subramanian" />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address (Login ID) *</label>
            <input type="email" id="email" required value={form.email} onChange={update('email')} placeholder="e.g. advocate@example.com" />
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

        <div style={{ margin: '24px 0 16px 0', borderBottom: '1px dashed var(--border-card)', paddingBottom: 8 }}>
          <div style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="bell" style={{ color: 'var(--accent)' }} />
            Hearing Notification Alerts
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="reminder_method">Reminder Channel</label>
            <select id="reminder_method" value={form.reminder_method} onChange={update('reminder_method')}>
              <option value="none">Off - No automated alerts</option>
              <option value="whatsapp">WhatsApp Messages</option>
              <option value="sms">SMS Text Messages</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reminder_days_before">Alert Schedule</label>
            <select id="reminder_days_before" value={form.reminder_days_before} onChange={update('reminder_days_before')}>
              {REMINDER_DAYS.map((d) => (
                <option key={d} value={d}>{d} day{d > 1 ? 's' : ''} before hearing</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="btn-submit" style={{ marginTop: 16 }}>Save Profile & Settings</button>
      </form>

      <div className="card-info staggered-entry" style={{ marginTop: 24 }}>
        <strong>Daily Dispatch Note:</strong> WhatsApp/SMS reminders are processed daily via <code>send_reminders.py</code>. You can also use the instant <strong>WhatsApp Share</strong> button directly on any case card on your Dashboard.
      </div>
    </div>
  );
}
