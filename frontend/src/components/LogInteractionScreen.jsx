import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createInteraction } from '../store/slices/interactionSlice';
import { sendChatMessage, addUserMessage, clearChat } from '../store/slices/chatSlice';

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`toast ${type}`}>
      <span>{type === 'success' ? '✓' : '✕'}</span>
      {message}
    </div>
  );
}

// ─── Tag input ────────────────────────────────────────────────────────────────
function TagInput({ tags, onAdd, onRemove, placeholder }) {
  const [val, setVal] = useState('');
  const handle = (e) => {
    if (e.key === 'Enter' && val.trim()) {
      onAdd(val.trim());
      setVal('');
      e.preventDefault();
    }
  };
  return (
    <div>
      <input
        className="form-control"
        placeholder={placeholder}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={handle}
      />
      {tags.length > 0 && (
        <div className="tag-list">
          {tags.map((t, i) => (
            <span className="tag" key={i}>
              {t}
              <button onClick={() => onRemove(i)}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Chat Message ─────────────────────────────────────────────────────────────
function ChatMessage({ msg, toolCalls }) {
  return (
    <div className={`chat-bubble ${msg.role}`}>
      {msg.role === 'assistant' && toolCalls && toolCalls.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          {toolCalls.map((tc, i) => (
            <span key={i} className="tool-badge">⚙ {tc.tool}</span>
          ))}
        </div>
      )}
      <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LogInteractionScreen() {
  const dispatch = useDispatch();
  const { messages, loading: chatLoading, lastToolCalls, pendingInteractionData } = useSelector(s => s.chat);
  const { loading: saving } = useSelector(s => s.interactions);

  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'chat'

  // Form state
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [form, setForm] = useState({
    hcp_name: '',
    hcp_id: 1,
    interaction_type: 'Meeting',
    date: today,
    time: nowTime,
    topics_discussed: '',
    outcomes: '',
    follow_up_actions: '',
    sentiment: 'Neutral',
  });
  const [attendees, setAttendees] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [samples, setSamples] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiSummary, setAiSummary] = useState('');

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // When AI returns interaction data, pre-fill form
  useEffect(() => {
    if (pendingInteractionData) {
      const d = pendingInteractionData;
      setForm(prev => ({
        ...prev,
        hcp_name: d.hcp_name || prev.hcp_name,
        interaction_type: d.interaction_type || prev.interaction_type,
        topics_discussed: d.topics_discussed || prev.topics_discussed,
        outcomes: d.outcomes || prev.outcomes,
        follow_up_actions: d.follow_up_actions || prev.follow_up_actions,
        sentiment: d.sentiment || prev.sentiment,
      }));
      if (d.attendees?.length) setAttendees(d.attendees);
      if (d.materials_shared?.length) setMaterials(d.materials_shared);
      if (d.samples_distributed?.length) setSamples(d.samples_distributed);
      if (d.ai_suggested_follow_ups?.length) setAiSuggestions(d.ai_suggested_follow_ups);
      if (d.ai_summary) setAiSummary(d.ai_summary);
      setToast({ message: 'AI filled the form from your chat!', type: 'success' });
    }
  }, [pendingInteractionData]);

  const handleField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // ── Form Submit ──
  const handleSubmit = async () => {
    if (!form.hcp_name || !form.topics_discussed) {
      setToast({ message: 'HCP name and topics are required', type: 'error' });
      return;
    }
    try {
      await dispatch(createInteraction({
        hcp_id: form.hcp_id,
        hcp_name: form.hcp_name,
        interaction_type: form.interaction_type,
        interaction_date: `${form.date}T${form.time}`,
        attendees,
        topics_discussed: form.topics_discussed,
        materials_shared: materials,
        samples_distributed: samples,
        sentiment: form.sentiment,
        outcomes: form.outcomes,
        follow_up_actions: form.follow_up_actions,
        ai_summary: aiSummary,
        ai_suggested_follow_ups: aiSuggestions,
      })).unwrap();
      setToast({ message: 'Interaction logged successfully!', type: 'success' });
      // Reset
      setForm({
        hcp_name: '', hcp_id: 1, interaction_type: 'Meeting',
        date: today, time: nowTime, topics_discussed: '',
        outcomes: '', follow_up_actions: '', sentiment: 'Neutral',
      });
      setAttendees([]); setMaterials([]); setSamples([]);
      setAiSuggestions([]); setAiSummary('');
      dispatch(clearChat());
    } catch (err) {
      setToast({ message: 'Failed to save interaction', type: 'error' });
    }
  };

  // ── Chat Send ──
  const handleChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    dispatch(addUserMessage(text));
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    dispatch(sendChatMessage({ message: text, history, hcp_id: form.hcp_id || null }));
  };

  const handleChatKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChat();
    }
  };

  const SENTIMENTS = ['Positive', 'Neutral', 'Negative'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top bar */}
      <div className="top-bar">
        <h1>Log HCP Interaction</h1>
        <div className="view-tabs">
          <button className={`view-tab${activeTab === 'form' ? ' active' : ''}`} onClick={() => setActiveTab('form')}>
            Form View
          </button>
          <button className={`view-tab${activeTab === 'chat' ? ' active' : ''}`} onClick={() => setActiveTab('chat')}>
            AI Chat View
          </button>
          <button className={`view-tab${activeTab === 'both' ? ' active' : ''}`} onClick={() => setActiveTab('both')}>
            Split View
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="page-body">
        <div className="log-screen" style={{
          gridTemplateColumns: activeTab === 'chat' ? '0 1fr' : activeTab === 'form' ? '1fr 0' : '1fr 340px'
        }}>

          {/* ── LEFT: Structured Form ── */}
          {activeTab !== 'chat' && (
            <div className="form-panel">
              <div className="panel-header">Interaction Details</div>
              <div className="panel-body" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>

                {/* HCP Name + Interaction Type */}
                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>HCP Name</label>
                    <input
                      className="form-control"
                      placeholder="Search or select HCP..."
                      value={form.hcp_name}
                      onChange={e => handleField('hcp_name', e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Interaction Type</label>
                    <select className="form-control" value={form.interaction_type} onChange={e => handleField('interaction_type', e.target.value)}>
                      {['Meeting', 'Call', 'Email', 'Conference', 'Virtual Meeting', 'Sample Drop'].map(t => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date + Time */}
                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Date</label>
                    <input type="date" className="form-control" value={form.date} onChange={e => handleField('date', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Time</label>
                    <input type="time" className="form-control" value={form.time} onChange={e => handleField('time', e.target.value)} />
                  </div>
                </div>

                {/* Attendees */}
                <div className="form-group">
                  <label>Attendees</label>
                  <TagInput
                    tags={attendees}
                    onAdd={v => setAttendees(prev => [...prev, v])}
                    onRemove={i => setAttendees(prev => prev.filter((_, idx) => idx !== i))}
                    placeholder="Enter names or search..."
                  />
                </div>

                {/* Topics */}
                <div className="form-group">
                  <label>Topics Discussed</label>
                  <textarea
                    className="form-control"
                    placeholder="Enter key discussion points..."
                    value={form.topics_discussed}
                    onChange={e => handleField('topics_discussed', e.target.value)}
                    rows={3}
                  />
                  <button className="voice-btn" style={{ marginTop: 8 }}>
                    <span>🎙</span> Summarize from Voice Note <span style={{ fontSize: 11, color: '#aab4c0' }}>(Requires Consent)</span>
                  </button>
                </div>

                {/* Materials Shared */}
                <div className="form-group">
                  <label>Materials Shared</label>
                  <TagInput
                    tags={materials}
                    onAdd={v => setMaterials(prev => [...prev, v])}
                    onRemove={i => setMaterials(prev => prev.filter((_, idx) => idx !== i))}
                    placeholder="Search/Add material..."
                  />
                </div>

                {/* Samples Distributed */}
                <div className="form-group">
                  <label>Samples Distributed</label>
                  <TagInput
                    tags={samples}
                    onAdd={v => setSamples(prev => [...prev, v])}
                    onRemove={i => setSamples(prev => prev.filter((_, idx) => idx !== i))}
                    placeholder="Add sample..."
                  />
                </div>

                {/* Sentiment */}
                <div className="form-group">
                  <label>Observed / Inferred HCP Sentiment</label>
                  <div className="sentiment-group">
                    {SENTIMENTS.map(s => (
                      <div
                        key={s}
                        className={`sentiment-option ${s.toLowerCase()}${form.sentiment === s ? ' selected' : ''}`}
                        onClick={() => handleField('sentiment', s)}
                      >
                        <span>{s === 'Positive' ? '😊' : s === 'Neutral' ? '😐' : '😟'}</span>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Outcomes */}
                <div className="form-group">
                  <label>Outcomes</label>
                  <textarea
                    className="form-control"
                    placeholder="Key outcomes or agreements..."
                    value={form.outcomes}
                    onChange={e => handleField('outcomes', e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Follow-up Actions */}
                <div className="form-group">
                  <label>Follow-up Actions</label>
                  <textarea
                    className="form-control"
                    placeholder="Enter next steps or tasks..."
                    value={form.follow_up_actions}
                    onChange={e => handleField('follow_up_actions', e.target.value)}
                    rows={2}
                  />
                </div>

                {/* AI Summary (if generated) */}
                {aiSummary && (
                  <div className="form-group">
                    <label>AI Summary</label>
                    <div style={{
                      padding: '10px 12px',
                      background: '#f8faff',
                      border: '1px solid #d0e2ff',
                      borderRadius: 7,
                      fontSize: 13,
                      color: '#1a2332',
                      lineHeight: 1.6
                    }}>
                      {aiSummary}
                    </div>
                  </div>
                )}

                {/* AI Suggested Follow-ups */}
                {aiSuggestions.length > 0 && (
                  <div className="form-group">
                    <div className="ai-follow-ups">
                      <div className="ai-label">
                        <span>✦</span> AI Suggested Follow-ups
                      </div>
                      <ul>
                        {aiSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  className="submit-btn"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : '↑ Log Interaction'}
                </button>
              </div>
            </div>
          )}

          {/* ── RIGHT: AI Chat Panel ── */}
          {activeTab !== 'form' && (
            <div className="chat-panel" style={{ minWidth: activeTab === 'chat' ? '100%' : 340 }}>
              <div className="chat-header">
                <div className="ai-avatar">AI</div>
                <div className="chat-header-info">
                  <h4>AI Assistant</h4>
                  <p>Log interaction via chat</p>
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-placeholder">
                    <div style={{ fontSize: 28, marginBottom: 10 }}>🤖</div>
                    <div style={{ fontWeight: 600, color: '#5a6a7e', marginBottom: 8 }}>
                      Log interactions naturally
                    </div>
                    <ul>
                      <li>Met Dr. Smith, discussed Product X efficacy, positive sentiment, shared brochure"</li>
                      <li>Called Dr. Patel about OncoPrime trial, left voicemail"</li>
                      <li>Show my last 5 interactions with Dr. Mehta"</li>
                      <li>Suggest follow-ups for my meeting yesterday"</li>
                      <li>Edit interaction #12 topics_discussed to cardiology update"</li>
                    </ul>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <ChatMessage
                      key={i}
                      msg={msg}
                      toolCalls={msg.role === 'assistant' && i === messages.length - 1 ? lastToolCalls : []}
                    />
                  ))
                )}
                {chatLoading && (
                  <div className="chat-bubble assistant">
                    <div className="typing-dots">
                      <span /><span /><span />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Tool activity indicator */}
              {chatLoading && lastToolCalls.length > 0 && (
                <div className="tool-activity">
                  <span className="spinning">⟳</span>
                  Running: {lastToolCalls[lastToolCalls.length - 1]?.tool}...
                </div>
              )}

              {/* Input */}
              <div className="chat-input-row">
                <textarea
                  ref={chatInputRef}
                  className="chat-input"
                  placeholder="Describe interaction..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleChatKey}
                  rows={1}
                />
                <button
                  className="chat-send-btn"
                  onClick={handleChat}
                  disabled={chatLoading || !chatInput.trim()}
                  title="Send (Enter)"
                >
                  ↑
                </button>
              </div>

              {/* Quick suggestions if no messages */}
              {messages.length === 0 && (
                <div style={{ padding: '0 14px 12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    'Log a meeting with Dr. Priya',
                    'Suggest follow-ups for Dr. Mehta',
                    'Analyze sentiment of my notes',
                  ].map(s => (
                    <button
                      key={s}
                      onClick={() => setChatInput(s)}
                      style={{
                        padding: '5px 10px', borderRadius: 20,
                        border: '1px solid #dce1e9', background: '#fafbfc',
                        fontSize: 11.5, cursor: 'pointer', color: '#5a6a7e',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
