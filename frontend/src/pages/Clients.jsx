import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Icon from '../components/Icon';
import Skeleton from '../components/Skeleton';
import { useReveal } from '../hooks/useReveal';

function ClientCard({ client, index }) {
  const [open, setOpen] = useState(false);
  const [revealRef, inView] = useReveal();
  const staggerCls = index < 4 ? 'staggered-entry' : `reveal-up${inView ? ' in-view' : ''}`;

  return (
    <div ref={revealRef} className={`card-form ${staggerCls} client-card`} style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 className="client-name" style={{ fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 700, color: 'var(--text-dark)' }}>
            {client.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: 13.5, color: 'var(--text-main)' }}>
            {client.phone ? (
              <span className="client-phone" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="phone" />
                {client.phone}
              </span>
            ) : (
              <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>No Phone Number Listed</span>
            )}
            <span className="meta-divider">|</span>
            <span style={{ fontWeight: 600, color: 'var(--accent-hover)' }}>
              {client.case_count} Case{client.case_count > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {client.phone && (
            <>
              <a href={`tel:${client.phone}`} className="btn-icon-text btn-ecourts" title="Call client phone">Call Client</a>
              <a href={`https://wa.me/${client.phone}`} target="_blank" rel="noopener noreferrer" className="btn-icon-text btn-edit" title="Send WhatsApp Message">WhatsApp</a>
            </>
          )}
          <button type="button" className="btn-icon-text" style={{ cursor: 'pointer', background: 'var(--primary)', color: 'white' }} onClick={() => setOpen((v) => !v)}>
            {open ? 'Hide Cases' : 'Show Cases'}
          </button>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 18, borderTop: '1px dashed var(--border-card)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-main)', marginBottom: 4 }}>
            Associated Active Files
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {client.cases.map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-app)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-dark)' }}>
                    {c.case_number}
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', marginLeft: 6 }}>({c.court_name})</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-main)', marginTop: 2 }}>
                    Next Hearing: <strong style={{ color: 'var(--primary-light)' }}>{c.next_hearing_date}</strong>
                    {c.case_type && <> {' | '}Type: <strong>{c.case_type}</strong></>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Link to={`/history/${c.id}`} className="btn-icon-text btn-edit" style={{ fontSize: 11, padding: '4px 8px' }}>History</Link>
                  <Link to={`/edit/${c.id}`} className="btn-icon-text btn-edit" style={{ fontSize: 11, padding: '4px 8px' }}>Edit</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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
