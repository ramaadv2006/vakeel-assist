import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import Icon from '../components/Icon';
import Skeleton from '../components/Skeleton';
import { useReveal } from '../hooks/useReveal';

function getInitials(name) {
  if (!name) return 'C';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name) {
  const colors = [
    'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
    'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #157f4a 0%, #10b981 100%)',
    'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
    'linear-gradient(135deg, #c026d3 0%, #d946ef 100%)',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash += name.charCodeAt(i);
  return colors[Math.abs(hash) % colors.length];
}

function ClientCard({ client, index }) {
  const [open, setOpen] = useState(false);
  const [revealRef, inView] = useReveal();
  const staggerCls = index < 4 ? 'staggered-entry' : `reveal-up${inView ? ' in-view' : ''}`;
  const initials = getInitials(client.name);
  const avatarBg = getAvatarColor(client.name);

  return (
    <motion.div
      ref={revealRef}
      className={`card-form ${staggerCls} client-card`}
      style={{
        padding: '22px 24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-card)',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      whileHover={{ y: -3, boxShadow: '0 12px 28px -6px rgba(11, 21, 38, 0.10)' }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 260 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: avatarBg,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: 0.5,
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          <div>
            <h3 className="client-name" style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 700, color: 'var(--text-dark)', margin: 0, lineHeight: 1.25 }}>
              {client.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5, fontSize: 13, color: 'var(--text-main)' }}>
              {client.phone ? (
                <span className="client-phone" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                  <Icon name="phone" style={{ width: 13, height: 13, color: 'var(--accent)' }} />
                  {client.phone}
                </span>
              ) : (
                <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>No phone listed</span>
              )}
              <span style={{ color: 'var(--gray-300)' }}>•</span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 11.5,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: 'var(--accent-bg)',
                  color: 'var(--accent-hover)',
                  border: '1px solid var(--accent-border)',
                }}
              >
                {client.case_count} Case{client.case_count > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {client.phone && (
            <>
              <motion.a
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                href={`tel:${client.phone}`}
                className="btn-icon-text btn-ecourts"
                title="Call client phone"
                style={{ padding: '7px 14px', fontSize: 12.5 }}
              >
                <Icon name="phone" style={{ width: 13, height: 13 }} />
                <span>Call</span>
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-icon-text btn-whatsapp"
                title="Send WhatsApp Message"
                style={{ padding: '7px 14px', fontSize: 12.5 }}
              >
                <span>WhatsApp</span>
              </motion.a>
            </>
          )}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            className={`btn-icon-text ${open ? 'btn-export' : 'btn-submit'}`}
            onClick={() => setOpen((v) => !v)}
            style={{ padding: '7px 16px', fontSize: 12.5, margin: 0 }}
          >
            {open ? 'Hide Cases' : `View Cases`}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: 18, borderTop: '1px solid var(--border-card)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)' }}>
                  Active Matters for {client.name}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{client.cases.length} court file{client.cases.length === 1 ? '' : 's'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {client.cases.map((c) => (
                  <motion.div
                    key={c.id}
                    whileHover={{ x: 4, borderColor: 'var(--accent)' }}
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-card)',
                      borderRadius: 'var(--radius-md)',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{c.case_number}</span>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>• {c.court_name}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-main)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>Next Hearing: <strong style={{ color: 'var(--accent-hover)' }}>{c.next_hearing_date}</strong></span>
                        {c.case_type && <span>| Type: <strong>{c.case_type}</strong></span>}
                        {c.case_stage && <span>| Stage: <strong>{c.case_stage}</strong></span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Link to={`/history/${c.id}`} className="btn-icon-text btn-export" style={{ fontSize: 12, padding: '5px 12px' }}>
                        History
                      </Link>
                      <Link to={`/edit/${c.id}`} className="btn-icon-text btn-edit" style={{ fontSize: 12, padding: '5px 12px' }}>
                        Edit
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Clients() {
  const [clients, setClients] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/clients').then((data) => setClients(data.clients));
  }, []);

  const filtered = useMemo(() => {
    if (!clients) return [];
    const q = query.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q));
  }, [clients, query]);

  if (!clients) {
    return (
      <div className="form-container" style={{ maxWidth: 900 }}>
        <Skeleton count={3} rows={2} widths={['40%', '70%']} />
      </div>
    );
  }

  return (
    <div className="form-container" style={{ maxWidth: 900 }}>
      {/* Top Hero Navigation */}
      <div className="page-hero-nav">
        <Link to="/" className="btn-back-dashboard">
          <span>←</span>
          <span>Back to Dashboard</span>
        </Link>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</Link>
          <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Clients</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }} className="staggered-entry">
        <div className="form-header" style={{ margin: 0, textAlign: 'left' }}>
          <h2>Client Rolodex Directory</h2>
          <p>List of unique clients and their active legal cases</p>
        </div>
        <div className="search-box" style={{ maxWidth: 320 }}>
          <Icon name="search" />
          <input type="text" placeholder="Search client name or phone..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map((client, i) => (
            <ClientCard key={`${client.name}-${client.phone}`} client={client} index={i} />
          ))}
        </div>
      ) : (
        <div className="empty-state staggered-entry">
          <Icon name="clients" style={{ width: 48, height: 48, stroke: '#cbd5e1' }} />
          <span>No clients found. Client records are automatically indexed once you create case files.</span>
        </div>
      )}
    </div>
  );
}
