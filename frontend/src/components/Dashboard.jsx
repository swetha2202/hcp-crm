import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInteractions } from '../store/slices/interactionSlice';
import { useNavigate } from 'react-router-dom';

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: '20px 24px',
      border: '1px solid #e5e9ef', borderLeft: `4px solid ${color}`
    }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#1a2332' }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#5a6a7e', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11.5, color: '#aab4c0', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list } = useSelector(s => s.interactions);

  useEffect(() => { dispatch(fetchInteractions()); }, [dispatch]);

  const total = list.length;
  const positive = list.filter(i => i.sentiment === 'Positive').length;
  const negative = list.filter(i => i.sentiment === 'Negative').length;
  const thisWeek = list.filter(i => {
    const d = new Date(i.interaction_date || i.created_at);
    const now = new Date();
    return (now - d) / (1000 * 60 * 60 * 24) <= 7;
  }).length;

  const recent = [...list].slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="top-bar">
        <h1>Dashboard</h1>
        <button
          className="submit-btn"
          style={{ width: 'auto', padding: '8px 20px', marginTop: 0 }}
          onClick={() => navigate('/log')}
        >
          + Log New Interaction
        </button>
      </div>
      <div className="page-body">

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard label="Total Interactions" value={total} sub="All time" color="#4f9cf9" />
          <StatCard label="This Week" value={thisWeek} sub="Last 7 days" color="#22c55e" />
          <StatCard label="Positive HCPs" value={positive} sub="Favorable sentiment" color="#a855f7" />
          <StatCard label="Needs Attention" value={negative} sub="Negative sentiment" color="#ef4444" />
        </div>

        {/* Recent */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e9ef', overflow: 'hidden' }}>
          <div className="panel-header" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Recent Interactions
            <button
              onClick={() => navigate('/history')}
              style={{ fontSize: 12, color: '#4f9cf9', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            >
              View All →
            </button>
          </div>
          {recent.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#aab4c0' }}>
              No interactions yet.{' '}
              <span style={{ color: '#4f9cf9', cursor: 'pointer' }} onClick={() => navigate('/log')}>
                Log your first one →
              </span>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafbfc', borderBottom: '1px solid #e5e9ef' }}>
                  {['HCP Name', 'Type', 'Date', 'Sentiment', 'AI Summary'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#8a99a8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map(i => (
                  <tr key={i.id} style={{ borderBottom: '1px solid #f0f4f8' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13.5 }}>{i.hcp_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#5a6a7e' }}>{i.interaction_type}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#5a6a7e' }}>
                      {new Date(i.interaction_date || i.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`sentiment-badge ${i.sentiment}`}>{i.sentiment}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12.5, color: '#5a6a7e', maxWidth: 260 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {i.ai_summary || '—'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* LangGraph tools card */}
        <div style={{ marginTop: 20, background: '#0f1923', borderRadius: 10, padding: '20px 24px', color: '#fff' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#4f9cf9', marginBottom: 12 }}>⚙ LangGraph AI Agent — Active Tools</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              { name: 'log_interaction', desc: 'Capture & summarize HCP visits via LLM', icon: '📝' },
              { name: 'edit_interaction', desc: 'Modify existing logged records', icon: '✏️' },
              { name: 'get_hcp_history', desc: 'Retrieve past visits for an HCP', icon: '📚' },
              { name: 'suggest_follow_ups', desc: 'AI next-step recommendations', icon: '💡' },
              { name: 'analyze_sentiment', desc: 'Infer HCP mood from notes', icon: '🔍' },
            ].map(tool => (
              <div key={tool.name} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{tool.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{tool.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{tool.desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
