import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInteractions, updateInteraction } from '../store/slices/interactionSlice';

function EditModal({ interaction, onClose, onSave }) {
  const [field, setField] = useState('topics_discussed');
  const [value, setValue] = useState('');
  const FIELDS = ['topics_discussed', 'outcomes', 'follow_up_actions', 'sentiment', 'attendees'];

  useEffect(() => {
    setValue(interaction[field] || '');
  }, [field, interaction]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>✎ Edit Interaction #{interaction.id}</h3>
        <div className="form-group">
          <label>Field to Edit</label>
          <select className="form-control" value={field} onChange={e => setField(e.target.value)}>
            {FIELDS.map(f => <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>New Value</label>
          <textarea className="form-control" rows={3} value={value} onChange={e => setValue(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => { onSave(interaction.id, field, value); onClose(); }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryView() {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(s => s.interactions);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => { dispatch(fetchInteractions()); }, [dispatch]);

  const filtered = list.filter(i =>
    i.hcp_name?.toLowerCase().includes(filter.toLowerCase()) ||
    i.topics_discussed?.toLowerCase().includes(filter.toLowerCase())
  );

  const handleSave = (id, field, value) => {
    dispatch(updateInteraction({ id, field, new_value: value }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="top-bar">
        <h1>Interaction History</h1>
        <input
          className="form-control"
          style={{ width: 240 }}
          placeholder="Search by HCP or topic..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ textAlign: 'center', color: '#8a99a8', padding: 40 }}>Loading interactions...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#8a99a8', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div>No interactions found. <a href="/log" style={{ color: '#4f9cf9' }}>Log one now →</a></div>
          </div>
        ) : (
          filtered.map(interaction => (
            <div className="history-card" key={interaction.id}>
              <div className="history-card-header">
                <div>
                  <div className="history-card-hcp">{interaction.hcp_name}</div>
                  <div style={{ fontSize: 12, color: '#8a99a8', marginTop: 2 }}>
                    {interaction.interaction_type} · {new Date(interaction.interaction_date).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`sentiment-badge ${interaction.sentiment}`}>{interaction.sentiment}</span>
                  <button
                    onClick={() => setEditing(interaction)}
                    style={{
                      padding: '5px 12px', borderRadius: 6,
                      border: '1px solid #dce1e9', background: '#fff',
                      fontSize: 12, cursor: 'pointer', color: '#5a6a7e',
                      fontFamily: 'Inter, sans-serif', fontWeight: 500
                    }}
                  >
                    ✎ Edit
                  </button>
                </div>
              </div>

              {interaction.topics_discussed && (
                <div style={{ fontSize: 13, color: '#3d4f62', marginBottom: 8, lineHeight: 1.5 }}>
                  <strong>Topics:</strong> {interaction.topics_discussed}
                </div>
              )}

              {interaction.ai_summary && (
                <div style={{
                  padding: '8px 12px', background: '#f0f7ff',
                  borderRadius: 6, fontSize: 12.5, color: '#1d4ed8',
                  marginBottom: 8, lineHeight: 1.5
                }}>
                  <span style={{ fontWeight: 600 }}>✦ AI Summary:</span> {interaction.ai_summary}
                </div>
              )}

              {interaction.ai_suggested_follow_ups?.length > 0 && (
                <div style={{ fontSize: 12, color: '#5a6a7e' }}>
                  <strong>Follow-ups:</strong>{' '}
                  {interaction.ai_suggested_follow_ups.slice(0, 2).join(' · ')}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {editing && (
        <EditModal
          interaction={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
