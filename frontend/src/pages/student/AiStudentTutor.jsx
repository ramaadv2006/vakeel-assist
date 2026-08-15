import { useState, useRef, useEffect } from 'react';
import { api } from '../../api/client';
import { useFlash } from '../../context/FlashContext';
import Icon from '../../components/Icon';

const QUICK_PROMPTS = [
  '🏛️ Explain the Doctrine of Basic Structure with milestone cases',
  '⚖️ Compare Section 302 IPC with Section 103 BNS (New Criminal Law)',
  '🏆 How to structure Moot Court Memorial Arguments and Submissions',
  '📝 Provide an IRAC / FIRAC model answer for a breach of contract problem',
  '📜 Distinguish between Res Judicata (CPC S.11) and Res Sub-Judice (CPC S.10)',
  '🛡️ What are the grounds to quash an FIR under Section 528 BNSS / 482 CrPC?',
];

export default function AiStudentTutor() {
  const addFlash = useFlash();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hello Counsel! I am **Professor Advo**, your AI Legal Mentor and Law Professor. I'm here to help you master Indian Constitutional Law, the new Bharatiya Nyaya Sanhita (BNS / BNSS / BSA), Moot Court memorial arguments, and exam preparation. What legal concept or problem shall we analyze today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMessage = { role: 'user', content: query };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = newMessages.map((m) => ({
        role: m.role,
        text: m.content,
      }));
      const res = await api.post('/student/ai-tutor', {
        message: query,
        history: historyPayload,
      });

      if (res.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
      }
    } catch (err) {
      addFlash(err.message || 'AI Legal Tutor response failed', 'error');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ I encountered an error answering your question. Please try asking again in a moment.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    addFlash('Copied to clipboard!', 'success');
  };

  const handleClear = () => {
    if (window.confirm('Clear conversation history?')) {
      setMessages([
        {
          role: 'assistant',
          content: 'Chat cleared! What new legal question or moot topic can I assist you with?',
        },
      ]);
    }
  };

  return (
    <div className="ai-tutor-page" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: 14 }}>
      {/* Tutor Header */}
      <div className="student-page-header staggered-entry" style={{ padding: '16px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid rgba(59, 130, 246, 0.35)',
              fontSize: 22,
            }}
          >
            🎓
          </div>
          <div>
            <h3 style={{ fontFamily: "'Lora', serif", margin: 0, fontSize: '1.25rem', color: 'var(--text-dark)', fontWeight: 700 }}>
              Professor Advo — Academic AI Legal Mentor
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Socratic Indian Law Tutor • Constitutional Doctrines • Moot Memorial Arguments • BNS Statutes
            </span>
          </div>
        </div>

        <button
          onClick={handleClear}
          style={{
            background: 'none',
            border: '1px solid var(--border-color)',
            padding: '7px 14px',
            borderRadius: 8,
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Clear Chat
        </button>
      </div>

      {/* Messages Container */}
      <div
        className="custom-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: '18px 22px',
          background: 'var(--bg-app)',
          borderRadius: 14,
          border: '1px solid var(--border-color)',
        }}
      >
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              {!isUser && (
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: 'var(--accent-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    flexShrink: 0,
                    border: '1px solid var(--accent)',
                  }}
                >
                  🎓
                </div>
              )}

              <div
                style={{
                  maxWidth: '75%',
                  padding: '14px 18px',
                  borderRadius: 12,
                  background: isUser ? 'var(--accent)' : 'var(--bg-card)',
                  color: isUser ? '#111827' : 'var(--text-dark)',
                  border: isUser ? 'none' : '1px solid var(--border-color)',
                  lineHeight: 1.6,
                  fontSize: 14,
                  whiteSpace: 'pre-wrap',
                  position: 'relative',
                }}
              >
                {!isUser && (
                  <button
                    onClick={() => handleCopy(msg.content)}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'none',
                      border: 'none',
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 2,
                    }}
                    title="Copy Answer"
                  >
                    📋
                  </button>
                )}
                {msg.content}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'var(--accent-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
            >
              🎓
            </div>
            <div
              style={{
                padding: '12px 18px',
                borderRadius: 12,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                fontSize: 13,
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              Professor Advo is researching relevant statutes and precedent cases...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Topic Chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {QUICK_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(p)}
            style={{
              whiteSpace: 'nowrap',
              padding: '6px 12px',
              borderRadius: 16,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              fontSize: 12,
              color: 'var(--text-main)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            className="chip-btn"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{ display: 'flex', gap: 10 }}
      >
        <input
          type="text"
          placeholder="Ask Professor Advo anything (e.g. Explain Section 482 CrPC vs 528 BNSS or help with a moot issue)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 18px',
            borderRadius: 10,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            fontSize: 14,
            color: 'var(--text-main)',
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary"
          style={{ padding: '0 24px', fontSize: 14 }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
