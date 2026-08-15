import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import Icon from '../../components/Icon';
import Skeleton from '../../components/Skeleton';

export default function StudyDeck() {
  const [deck, setDeck] = useState({
    constitution: [
      { title: 'Article 21', subtitle: 'Protection of Life and Personal Liberty', details: 'No person shall be deprived of his life or personal liberty except according to procedure established by law.', landmark_case: 'Maneka Gandhi v. Union of India (1978)', tag: 'Fundamental Right' },
      { title: 'Article 32 & 226', subtitle: 'Constitutional Remedies & Writs', details: 'Right to move Supreme Court (Art 32) and High Courts (Art 226) for enforcement of Fundamental Rights via Habeas Corpus, Mandamus, Prohibition, Quo Warranto, and Certiorari.', landmark_case: 'Fertilizer Corporation Kamgar Union (1981)', tag: 'Constitutional Writs' },
    ],
    criminal_new_laws: [
      { title: 'Murder: BNS Sec 103 vs IPC Sec 302', subtitle: 'Bharatiya Nyaya Sanhita Transition', details: 'Section 103 BNS replaces Section 302 IPC for murder, introducing sub-sections for mob lynching and group hate crimes.', tag: 'Criminal Law' },
    ],
    maxims: [
      { maxim: 'Audi Alteram Partem', meaning: 'Hear the other side / No one should be condemned unheard', branch: 'Administrative Law', landmark_case: 'Maneka Gandhi v. UOI (1978)', explanation: 'Fundamental principle of Natural Justice.' },
    ],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('constitution');
  const [search, setSearch] = useState('');
  const [flippedCards, setFlippedCards] = useState({});
  const [quizMode, setQuizMode] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizFlipped, setQuizFlipped] = useState(false);
  const [score, setScore] = useState(0);

  const loadDeck = async () => {
    try {
      const res = await api.get('/student/study-deck');
      if (res && typeof res === 'object') {
        setDeck(res);
      }
    } catch (err) {
      console.error('Failed to load study deck:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeck();
  }, []);

  if (loading && !deck) return <Skeleton count={4} rows={3} />;

  const toggleFlip = (id) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getItemsForTab = () => {
    if (activeTab === 'constitution') return deck.constitution || [];
    if (activeTab === 'criminal_new_laws') return deck.criminal_new_laws || [];
    if (activeTab === 'maxims') return deck.maxims || [];
    return [];
  };

  const rawItems = getItemsForTab();
  const filteredItems = rawItems.filter((item) => {
    const q = search.toLowerCase();
    const hay = [
      item.title, item.subtitle, item.details, item.tag,
      item.maxim, item.meaning, item.landmark_case, item.explanation, item.branch
    ].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  });

  const quizPool = activeTab === 'maxims'
    ? (deck.maxims || [])
    : [...(deck.constitution || []), ...(deck.criminal_new_laws || [])];

  const currentQuizItem = quizPool[quizIndex % (quizPool.length || 1)];

  const handleNextQuiz = (knewIt) => {
    if (knewIt) setScore((s) => s + 1);
    setQuizFlipped(false);
    setQuizIndex((idx) => (idx + 1) % quizPool.length);
  };

  return (
    <div className="study-deck-page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Bar */}
      <div className="student-page-header staggered-entry">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139, 92, 246, 0.15)', display: 'grid', placeItems: 'center', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <Icon name="deck" style={{ width: 20, height: 20 }} />
            </div>
            <h2 style={{ fontFamily: "'Lora', serif", margin: 0, fontSize: '1.45rem', color: 'var(--text-dark)', fontWeight: 700 }}>
              Bare Acts, BNS & Maxims Study Deck
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            High-yield provisions, Latin maxims, and new criminal laws (BNS / BNSS / BSA) reference flashcards.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { setQuizMode(!quizMode); setQuizFlipped(false); setScore(0); }}
          className={quizMode ? 'btn-student-glass' : 'btn-student-purple'}
        >
          <Icon name="sparkles" style={{ width: 16, height: 16 }} />
          <span>{quizMode ? 'Exit Quiz Mode' : '🧠 Flashcard Quiz Mode'}</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', background: 'var(--bg-app)', padding: 4, borderRadius: 10, border: '1px solid var(--border-color)', gap: 4 }}>
          <button
            type="button"
            onClick={() => { setActiveTab('constitution'); setQuizIndex(0); setQuizFlipped(false); }}
            style={{
              padding: '8px 16px',
              fontSize: '0.84rem',
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'constitution' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'constitution' ? '#111827' : 'var(--text-muted)',
            }}
          >
            🏛️ Constitution & Writs
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('criminal_new_laws'); setQuizIndex(0); setQuizFlipped(false); }}
            style={{
              padding: '8px 16px',
              fontSize: '0.84rem',
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'criminal_new_laws' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'criminal_new_laws' ? '#111827' : 'var(--text-muted)',
            }}
          >
            ⚖️ New Criminal Laws (BNS)
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('maxims'); setQuizIndex(0); setQuizFlipped(false); }}
            style={{
              padding: '8px 16px',
              fontSize: '0.84rem',
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'maxims' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'maxims' ? '#111827' : 'var(--text-muted)',
            }}
          >
            📜 Latin Maxims
          </button>
        </div>

        {!quizMode && (
          <input
            type="text"
            placeholder="Search flashcards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: 10,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.86rem',
              width: 240,
            }}
          />
        )}
      </div>

      {/* Quiz Mode View */}
      {quizMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, maxWidth: 640, margin: '0 auto', width: '100%' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Question {quizIndex + 1} of {quizPool.length} • Score: <strong>{score}</strong>
          </div>

          <div
            onClick={() => setQuizFlipped(!quizFlipped)}
            className="card-form"
            style={{
              width: '100%',
              minHeight: 280,
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              borderRadius: 16,
              border: '2px solid var(--accent)',
              background: 'linear-gradient(145deg, var(--bg-card) 0%, rgba(212, 160, 23, 0.04) 100%)',
              transition: 'transform 0.2s ease',
            }}
          >
            {!quizFlipped ? (
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-hover)', letterSpacing: '0.08em' }}>
                  {currentQuizItem.tag || currentQuizItem.branch || 'Prompt'}
                </span>
                <h3 style={{ fontFamily: "'Lora', serif", fontSize: 24, margin: '14px 0 8px 0', color: 'var(--text-dark)' }}>
                  {currentQuizItem.maxim || currentQuizItem.title}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                  {currentQuizItem.subtitle || 'Click / Tap to flip and reveal legal explanation & precedents'}
                </p>
              </div>
            ) : (
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#10b981' }}>
                  Answer & Application
                </span>
                <h4 style={{ fontFamily: "'Lora', serif", fontSize: 20, margin: '10px 0 6px 0', color: 'var(--text-dark)' }}>
                  {currentQuizItem.meaning || currentQuizItem.subtitle}
                </h4>
                <p style={{ fontSize: 14, color: 'var(--text-main)', lineHeight: 1.6, margin: '10px 0' }}>
                  {currentQuizItem.explanation || currentQuizItem.details}
                </p>
                {currentQuizItem.landmark_case && (
                  <div style={{ fontSize: 12, padding: '6px 12px', background: 'var(--bg-app)', borderRadius: 6, display: 'inline-block', border: '1px solid var(--border-color)' }}>
                    <strong>Precedent:</strong> {currentQuizItem.landmark_case}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}>
            <button
              onClick={() => handleNextQuiz(false)}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ❌ Need Practice
            </button>
            <button
              onClick={() => handleNextQuiz(true)}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--accent)',
                color: '#111827',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✅ Mastered It!
            </button>
          </div>
        </div>
      ) : (
        /* Regular Flashcard Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filteredItems.map((item, idx) => {
            const cardId = `${activeTab}-${idx}`;
            const isFlipped = flippedCards[cardId];
            return (
              <div
                key={cardId}
                className="card-form staggered-entry"
                onClick={() => toggleFlip(cardId)}
                style={{
                  padding: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12,
                  borderRadius: 12,
                  border: isFlipped ? '1.5px solid var(--accent)' : '1px solid var(--border-color)',
                  background: isFlipped ? 'rgba(212, 160, 23, 0.04)' : 'var(--bg-card)',
                  transition: 'all 0.2s ease',
                  minHeight: 180,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 5,
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                      }}
                    >
                      {item.tag || item.branch || 'Law Study'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Click to {isFlipped ? 'close' : 'expand'}</span>
                  </div>

                  <h3 style={{ fontFamily: "'Lora', serif", fontSize: 18, margin: '4px 0 4px 0', color: 'var(--text-dark)' }}>
                    {item.maxim ? `"${item.maxim}"` : item.title}
                  </h3>

                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-hover)' }}>
                    {item.meaning || item.subtitle}
                  </div>

                  {isFlipped && (
                    <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5, borderTop: '1px dashed var(--border-color)', paddingTop: 8 }}>
                      <div>{item.explanation || item.details}</div>
                      {item.landmark_case && (
                        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                          <strong>Landmark Case:</strong> {item.landmark_case}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
