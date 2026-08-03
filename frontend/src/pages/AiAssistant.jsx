import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';
import Icon from '../components/Icon';
import '../styles/AiAssistant.css';

export default function AiAssistant() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'analysis'

  // --- Chat State ---
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Greetings Advocate! I am Advo Buddy AI ⚖️. How can I assist with your legal research, case strategy, or drafting today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // --- Case Analysis State ---
  const [file, setFile] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  // Handle send message
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || chatLoading) return;

    const newHistory = [...messages, { role: 'user', text }];
    setMessages(newHistory);
    if (!textToSend) setInput('');
    setChatLoading(true);

    try {
      const res = await api.post('/chat', {
        message: text,
        history: newHistory,
      });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: res.reply || 'No response returned from AI.' },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ ${err.message || 'Failed to communicate with AI Assistant. Ensure AI_API_KEY is configured in your environment.'}`,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle file analysis upload
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setAnalysisError('');
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!file || analysisLoading) return;

    setAnalysisLoading(true);
    setAnalysisError('');
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('caseFile', file);

    try {
      const res = await api.post('/analyze-case', formData, { isForm: true });
      setAnalysisResult(res.analysis);
    } catch (err) {
      setAnalysisError(err.message || 'Failed to analyze the document.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const quickPrompts = [
    'Draft a legal notice format under Section 138 Negotiable Instruments Act',
    'What are the key grounds for bail under Section 437 CrPC / BNSS?',
    'Summarize essential elements required for a Civil Suit for Permanent Injunction',
  ];

  return (
    <div className="ai-assistant-container">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-header-title">
          <div className="ai-badge-icon">
            <Icon name="ai" style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <h2>Advo Buddy AI Assistant</h2>
            <p>Intelligent Legal Q&A & AI Case Document Breakdown</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="ai-nav-tabs">
          <button
            className={`ai-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <Icon name="ai" style={{ width: 16, height: 16 }} />
            Legal Chat
          </button>
          <button
            className={`ai-tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            <Icon name="case" style={{ width: 16, height: 16 }} />
            Case Document Analysis
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="ai-card">
        {activeTab === 'chat' ? (
          /* CHAT TAB */
          <div className="ai-chat-wrapper">
            <div className="ai-chat-messages">
              {messages.map((m, idx) => (
                <div key={idx} className={`chat-bubble-group ${m.role}`}>
                  <span className="chat-sender-label">
                    {m.role === 'user' ? 'You' : 'Advo Buddy AI'}
                  </span>
                  <div className={`chat-bubble ${m.role}`}>{m.text}</div>
                </div>
              ))}

              {chatLoading && (
                <div className="chat-bubble-group assistant">
                  <span className="chat-sender-label">Advo Buddy AI</span>
                  <div className="chat-bubble assistant chat-typing">
                    <span>Advo Buddy is analyzing</span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Chips */}
            {messages.length <= 2 && (
              <div style={{ padding: '0 20px 10px' }}>
                <div className="chat-suggestions">
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      className="chip-suggestion"
                      onClick={() => handleSendMessage(prompt)}
                      disabled={chatLoading}
                    >
                      💡 {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Row */}
            <div className="ai-chat-input-area">
              <textarea
                className="ai-chat-textarea"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a legal question, law provision, or drafting query..."
              />
              <button
                className="ai-send-btn"
                onClick={() => handleSendMessage()}
                disabled={chatLoading || !input.trim()}
              >
                Send
                <Icon name="ai" style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>
        ) : (
          /* CASE ANALYSIS TAB */
          <div className="ai-analysis-wrapper">
            <div>
              <h3 style={{ margin: '0 0 6px', fontFamily: 'Lora, serif', color: 'var(--text-dark)' }}>
                Upload Case File for AI Breakdown
              </h3>
              <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: 14 }}>
                Upload a case document (PDF, DOCX, or TXT) to extract key parties, legal issues, applicable sections, risk assessment, and recommendations.
              </p>
            </div>

            {/* Dropzone / Upload Box */}
            <label className="dropzone-box">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div className="dropzone-icon">
                <Icon name="case" style={{ width: 28, height: 28 }} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: 'var(--text-dark)' }}>
                  Click or drag case document to select
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray-500)' }}>
                  Supports PDF, DOCX, TXT files up to 15MB
                </p>
              </div>
              <span className="file-select-btn">Browse Files</span>
            </label>

            {file && (
              <div className="analyze-action-row">
                <span className="selected-file-badge">
                  📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setAnalysisResult(null);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 'bold' }}
                  >
                    ✕
                  </button>
                </span>
                <button
                  className="ai-send-btn"
                  onClick={handleAnalyzeDocument}
                  disabled={analysisLoading}
                >
                  {analysisLoading ? 'Analyzing Document...' : 'Analyze Document'}
                  <Icon name="ai" style={{ width: 16, height: 16 }} />
                </button>
              </div>
            )}

            {analysisError && (
              <div className="ai-key-warning" style={{ background: 'var(--danger-bg)', borderColor: '#f7c2c0', color: 'var(--danger)' }}>
                ⚠️ {analysisError}
              </div>
            )}

            {/* Analysis Results Display */}
            {analysisResult && (
              <div className="analysis-results-card">
                <h3 style={{ margin: 0, fontFamily: 'Lora, serif', color: 'var(--primary)', fontSize: 20 }}>
                  Structured Case Analysis
                </h3>

                {analysisResult.summary && (
                  <div className="analysis-section">
                    <h4>📌 Executive Summary</h4>
                    <p>{analysisResult.summary}</p>
                  </div>
                )}

                {analysisResult.keyParties?.length > 0 && (
                  <div className="analysis-section">
                    <h4>👥 Key Parties Involved</h4>
                    <ul>
                      {analysisResult.keyParties.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.keyIssues?.length > 0 && (
                  <div className="analysis-section">
                    <h4>⚖️ Key Legal Issues & Dispute Points</h4>
                    <ul>
                      {analysisResult.keyIssues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.relevantSections?.length > 0 && (
                  <div className="analysis-section">
                    <h4>📖 Relevant Statutory Sections & Precedents</h4>
                    <ul>
                      {analysisResult.relevantSections.map((sec, idx) => (
                        <li key={idx}>{sec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.riskAssessment && (
                  <div className="analysis-section risk-box">
                    <h4>⚠️ Risk Assessment</h4>
                    <p>{analysisResult.riskAssessment}</p>
                  </div>
                )}

                {analysisResult.recommendations?.length > 0 && (
                  <div className="analysis-section">
                    <h4>💡 Actionable Recommendations & Strategy</h4>
                    <ul>
                      {analysisResult.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="disclaimer-footer">
        Advo Buddy AI is designed as a practice assistant for legal research and case analysis. AI generated outputs should be reviewed against official legal precedents and statutes.
      </div>
    </div>
  );
}
