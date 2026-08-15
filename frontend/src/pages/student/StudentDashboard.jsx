import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/Icon';
import Skeleton from '../../components/Skeleton';
import StatCard from '../../components/StatCard';

export default function StudentDashboard() {
  const { advocate } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({
    active_moots_count: 0,
    total_moots_count: 0,
    active_internship: null,
    total_observation_logs: 0,
    case_briefs_count: 0,
    recent_briefs: [],
    pending_tasks_count: 0,
    recent_tasks: [],
    upcoming_deadlines: [],
    maxim_of_the_day: {
      maxim: 'Injuria Sine Damno',
      meaning: 'Legal injury without monetary loss (actionable per se)',
      branch: 'Law of Torts',
      landmark_case: 'Ashby v. White (1703)',
      explanation: 'Actionable infringement of an absolute legal right even without actual physical or financial damage.',
    },
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await api.get('/student/dashboard');
      if (res && typeof res === 'object') {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return <Skeleton count={4} rows={2} widths={['50%', '85%']} />;
  }

  const {
    active_moots_count = 0,
    active_internship,
    total_observation_logs = 0,
    case_briefs_count = 0,
    pending_tasks_count = 0,
    recent_briefs = [],
    upcoming_deadlines = [],
    maxim_of_the_day,
  } = data || {};

  return (
    <div className="student-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Student Welcome Banner */}
      <div className="student-hero-banner staggered-entry">
        <div style={{ zIndex: 2, maxWidth: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span className="student-hero-tag">
              <span>🎓</span> ACADEMIC & MOOT PORTAL
            </span>
            {advocate?.course_year && (
              <span style={{ fontSize: '0.84rem', color: '#93c5fd', fontWeight: 600 }}>
                • {advocate.course_year}
              </span>
            )}
          </div>
          <h2 className="student-hero-title">
            Welcome back, {advocate?.name || 'Counsel'}
          </h2>
          <p className="student-hero-desc">
            {advocate?.college_name
              ? `${advocate.college_name} • Moot Court Memorials, FIRAC Case Briefs & Court Observation Diary`
              : 'Your dedicated legal workspace for Moot Court drafting, BCI Internship Logs, and Landmark Case Briefs.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', zIndex: 2, alignItems: 'center' }}>
          <button
            onClick={() => navigate('/student/briefs?new=1')}
            className="btn-student-gold"
          >
            <Icon name="sparkles" style={{ width: 16, height: 16 }} />
            <span>AI Case Brief</span>
          </button>
          <button
            onClick={() => navigate('/student/tutor')}
            className="btn-student-glass"
          >
            <Icon name="tutor" style={{ width: 16, height: 16, color: '#93c5fd' }} />
            <span>AI Legal Tutor</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="stats-row staggered-entry" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
        <StatCard
          value={active_moots_count}
          label="Active Moots"
          icon="trophy"
          color="#3b82f6"
          hint={`${data?.total_moots_count || 0} Total Tracked`}
        />
        <StatCard
          value={total_observation_logs}
          label="Court Days Logged"
          icon="internship"
          color="#10b981"
          hint={active_internship?.organization || 'BCI Diary'}
        />
        <StatCard
          value={case_briefs_count}
          label="FIRAC Case Briefs"
          icon="briefs"
          color="#f59e0b"
          hint="Landmark & Course Judgments"
        />
        <StatCard
          value={pending_tasks_count}
          label="Study Tasks"
          icon="tasks"
          color="#8b5cf6"
          hint="Assignments & Exams"
        />
      </div>

      {/* Maxim of the Day & Quick Launch Row */}
      <div className="student-grid-2col">
        {/* Maxim Card */}
        {maxim_of_the_day && (
          <div
            className="card-form staggered-entry"
            style={{
              padding: 24,
              background: 'linear-gradient(145deg, var(--bg-card) 0%, rgba(212, 160, 23, 0.05) 100%)',
              border: '1px solid rgba(212, 160, 23, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--accent-hover)',
                    background: 'var(--accent-bg)',
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: '1px solid rgba(212, 160, 23, 0.25)',
                  }}
                >
                  ⚖️ Legal Maxim of the Day
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{maxim_of_the_day.branch}</span>
              </div>
              <h3
                style={{
                  fontFamily: "'Lora', serif",
                  fontSize: '1.28rem',
                  margin: '0 0 6px 0',
                  color: 'var(--text-dark)',
                  fontStyle: 'italic',
                }}
              >
                "{maxim_of_the_day.maxim}"
              </h3>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 10px 0' }}>
                {maxim_of_the_day.meaning}
              </p>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 14 }}>
                {maxim_of_the_day.explanation}
              </div>
            </div>
            <div
              style={{
                fontSize: '0.8rem',
                padding: '9px 12px',
                background: 'var(--bg-app)',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
              }}
            >
              <strong style={{ color: 'var(--accent)' }}>Precedent:</strong> {maxim_of_the_day.landmark_case}
            </div>
          </div>
        )}

        {/* Quick Hub Portals */}
        <div className="card-form staggered-entry" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Lora', serif", fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: 2 }}>
              Academic Core Modules
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Quick access to research and competition preparation tools
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Link to="/student/moots" className="quick-tile">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#3b82f6', fontWeight: 600, fontSize: '0.88rem' }}>
                <Icon name="trophy" style={{ width: 18, height: 18 }} />
                <span>Moot Court</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                Memorials & bench notes
              </span>
            </Link>

            <Link to="/student/briefs" className="quick-tile">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#f59e0b', fontWeight: 600, fontSize: '0.88rem' }}>
                <Icon name="briefs" style={{ width: 18, height: 18 }} />
                <span>Case Briefs</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                FIRAC & ratio decidendi
              </span>
            </Link>

            <Link to="/student/internships" className="quick-tile">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#10b981', fontWeight: 600, fontSize: '0.88rem' }}>
                <Icon name="internship" style={{ width: 18, height: 18 }} />
                <span>Court Diary</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                BCI observation logs
              </span>
            </Link>

            <Link to="/student/study-deck" className="quick-tile">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#8b5cf6', fontWeight: 600, fontSize: '0.88rem' }}>
                <Icon name="deck" style={{ width: 18, height: 18 }} />
                <span>Study Deck</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                Bare Acts, BNS & Maxims
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Deadlines & Recent Briefs Split Grid */}
      <div className="student-grid-2col">
        {/* Deadlines list */}
        <div className="card-form staggered-entry" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="calendar" style={{ color: 'var(--accent)' }} />
              Upcoming Academic Deadlines
            </div>
            <Link to="/student/tasks" style={{ fontSize: 12, color: 'var(--accent-hover)', textDecoration: 'none', fontWeight: 600 }}>
              View All Tasks →
            </Link>
          </div>

          {upcoming_deadlines.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
              <Icon name="check" style={{ width: 32, height: 32, opacity: 0.4, marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 14 }}>No upcoming deadlines right now.</p>
              <Link to="/student/tasks" style={{ fontSize: 13, color: 'var(--accent)', marginTop: 6, display: 'inline-block' }}>
                + Add Study Task or Assignment
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcoming_deadlines.map((dl, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)' }}>{dl.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {dl.type} {dl.side ? `• Side: ${dl.side}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: (dl.badge || '').includes('Memorial') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: (dl.badge || '').includes('Memorial') ? '#f87171' : '#60a5fa',
                      }}
                    >
                      {dl.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Case Briefs */}
        <div className="card-form staggered-entry" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="briefs" style={{ color: 'var(--accent)' }} />
              Recent FIRAC Case Briefs
            </div>
            <Link to="/student/briefs" style={{ fontSize: 12, color: 'var(--accent-hover)', textDecoration: 'none', fontWeight: 600 }}>
              Briefs Library →
            </Link>
          </div>

          {recent_briefs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
              <Icon name="briefs" style={{ width: 32, height: 32, opacity: 0.4, marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 14 }}>No case briefs created yet.</p>
              <button
                onClick={() => navigate('/student/briefs?new=1')}
                style={{
                  marginTop: 10,
                  background: 'none',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent-hover)',
                  padding: '6px 14px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                + Brief Your First Case with AI
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recent_briefs.map((b) => (
                <Link
                  key={b.id}
                  to={`/student/briefs/${b.id}`}
                  style={{
                    textDecoration: 'none',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  className="brief-link-row"
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)' }}>{b.case_title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {b.citation || b.court || 'Landmark Case'}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: 'rgba(212, 160, 23, 0.12)',
                      color: 'var(--accent-hover)',
                    }}
                  >
                    {b.subject || 'Law'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
