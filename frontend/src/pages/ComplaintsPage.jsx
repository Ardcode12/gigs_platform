import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { getCategoryInfo, formatDate, formatTime } from '../constants';
import { AlertTriangle, X, MessageSquare, ArrowUpCircle, CheckCircle, Clock } from 'lucide-react';

const SeverityBadge = ({ severity }) => {
  const map = {
    low: ['badge-muted', '🟢 Low'],
    medium: ['badge-warning', '🟡 Medium'],
    high: ['badge-orange', '🔴 High'],
    critical: ['badge-danger', '🚨 Critical'],
  };
  const [cls, label] = map[severity] || ['badge-muted', severity];
  return <span className={`badge ${cls}`}>{label}</span>;
};

const ComplaintTypeBadge = ({ type }) => {
  const map = {
    quality: ['badge-orange', '🔧 Quality Issue'],
    behaviour: ['badge-warning', '😤 Behaviour'],
    delay: ['badge-sky', '⏰ Delay'],
    fraud: ['badge-danger', '🚨 Fraud'],
    payment: ['badge-violet', '💰 Payment'],
  };
  const [cls, label] = map[type] || ['badge-muted', type];
  return <span className={`badge ${cls}`}>{label}</span>;
};

const StatusBadge = ({ status }) => {
  const map = {
    open: ['badge-danger', '🔴 Open'],
    under_review: ['badge-warning', '🟡 Under Review'],
    resolved: ['badge-success', '✅ Resolved'],
    escalated: ['badge-violet', '⬆️ Escalated'],
  };
  const [cls, label] = map[status] || ['badge-muted', status];
  return <span className={`badge ${cls}`}>{label}</span>;
};

// ============== Complaint Detail Modal ==============
const ComplaintDetailModal = ({ complaint, onClose, onRespond, onResolve, onEscalate }) => {
  const [response, setResponse] = useState('');
  const [resolution, setResolution] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [mode, setMode] = useState('respond'); // 'respond' | 'resolve' | 'escalate'
  const cat = getCategoryInfo(complaint.category);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{complaint.id} · {complaint.title}</div>
            <div className="modal-sub">{cat.emoji} {cat.label} · Raised {formatDate(complaint.raisedAt)}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {/* Complaint Info */}
          <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
              <div><span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Customer</span><span style={{ fontWeight: 600 }}>{complaint.customerName}</span></div>
              <div style={{ marginLeft: 'auto' }}><span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Worker</span><span style={{ fontWeight: 600 }}>{complaint.workerName}</span></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <ComplaintTypeBadge type={complaint.type} />
              <SeverityBadge severity={complaint.severity} />
              <StatusBadge status={complaint.status} />
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{complaint.description}</div>
          </div>

          {/* Responses History */}
          {complaint.responses.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Response History</div>
              {complaint.responses.map((r, i) => (
                <div key={i} style={{ background: 'var(--primary-light)', borderRadius: 8, padding: '8px 12px', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--primary-dark)' }}>🏛️ Society Admin: </span>{r}
                </div>
              ))}
            </div>
          )}

          {/* Action Mode Selector */}
          {complaint.status !== 'resolved' && complaint.status !== 'escalated' && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {[
                  { id: 'respond', label: '💬 Respond', icon: <MessageSquare size={13} /> },
                  { id: 'resolve', label: '✅ Resolve', icon: <CheckCircle size={13} /> },
                  { id: 'escalate', label: '⬆️ Escalate to Federation', icon: <ArrowUpCircle size={13} /> },
                ].map(m => (
                  <button key={m.id} className={`btn btn-sm ${mode === m.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode(m.id)}>
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>

              {mode === 'respond' && (
                <div>
                  <div className="form-label">Add Response</div>
                  <textarea className="form-textarea" placeholder="Enter your response to the customer/worker..." value={response} onChange={e => setResponse(e.target.value)} />
                </div>
              )}
              {mode === 'resolve' && (
                <div>
                  <div className="form-label">Resolution Details</div>
                  <textarea className="form-textarea" placeholder="Describe how this complaint was resolved..." value={resolution} onChange={e => setResolution(e.target.value)} />
                </div>
              )}
              {mode === 'escalate' && (
                <div>
                  <div className="alert alert-danger mb-3">
                    <AlertTriangle size={14} />
                    Escalating sends this complaint to the Federation dashboard for higher-level review. Use this for fraud, major losses, or unresolvable disputes.
                  </div>
                  <div className="form-label">Reason for Escalation</div>
                  <textarea className="form-textarea" placeholder="Why can't this be resolved at district level?" value={escalateReason} onChange={e => setEscalateReason(e.target.value)} />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          {mode === 'respond' && complaint.status !== 'resolved' && complaint.status !== 'escalated' && (
            <button className="btn btn-primary" disabled={!response} onClick={() => { onRespond(complaint.id, response); onClose(); }}>
              <MessageSquare size={14} /> Send Response
            </button>
          )}
          {mode === 'resolve' && (
            <button className="btn btn-success" disabled={!resolution} onClick={() => { onResolve(complaint.id, resolution); onClose(); }}>
              <CheckCircle size={14} /> Mark Resolved
            </button>
          )}
          {mode === 'escalate' && (
            <button className="btn btn-danger" disabled={!escalateReason} onClick={() => { onEscalate(complaint.id, escalateReason); onClose(); }}>
              <ArrowUpCircle size={14} /> Escalate to Federation
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============== Main Complaints Page ==============
const ComplaintsPage = () => {
  const { complaints, resolveComplaint, escalateComplaint, addComplaintResponse } = useSociety();
  const [activeTab, setActiveTab] = useState('open');
  const [selected, setSelected] = useState(null);

  const filtered = complaints.filter(c => {
    if (activeTab === 'open') return c.status === 'open';
    if (activeTab === 'review') return c.status === 'under_review';
    if (activeTab === 'resolved') return c.status === 'resolved';
    if (activeTab === 'escalated') return c.status === 'escalated';
    return true;
  });

  const tabs = [
    { id: 'open', label: '🔴 Open', count: complaints.filter(c => c.status === 'open').length },
    { id: 'review', label: '🟡 Under Review', count: complaints.filter(c => c.status === 'under_review').length },
    { id: 'resolved', label: '✅ Resolved', count: complaints.filter(c => c.status === 'resolved').length },
    { id: 'escalated', label: '⬆️ Escalated', count: complaints.filter(c => c.status === 'escalated').length },
    { id: 'all', label: 'All', count: complaints.length },
  ];

  return (
    <div className="page-body fade-in">
      {/* Summary */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Open', count: complaints.filter(c => c.status === 'open').length, color: 'var(--danger)', bg: '#FEE2E2' },
          { label: 'Under Review', count: complaints.filter(c => c.status === 'under_review').length, color: 'var(--warning)', bg: '#FEF3C7' },
          { label: 'Escalated', count: complaints.filter(c => c.status === 'escalated').length, color: 'var(--violet)', bg: '#EDE9FE' },
          { label: 'Resolved', count: complaints.filter(c => c.status === 'resolved').length, color: 'var(--success)', bg: '#D1FAE5' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: s.color }}>{s.count}</span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Complaints & Disputes</div>
            <div className="card-subtitle">Handle customer complaints locally or escalate unresolvable ones to Federation</div>
          </div>
        </div>
        <div style={{ padding: '0 20px' }}>
          <div className="tabs">
            {tabs.map(t => (
              <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                {t.label} <span className="tab-count">{t.count}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: '8px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><CheckCircle size={40} color="var(--success)" /></div>
              <div className="empty-title">No complaints here</div>
              <div className="empty-desc">This section is clear. Keep up the good work!</div>
            </div>
          ) : filtered.map(c => {
            const cat = getCategoryInfo(c.category);
            return (
              <div key={c.id} className="complaint-card" onClick={() => setSelected(c)} style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
                <div className="complaint-header">
                  <div>
                    <div className="complaint-id">{c.id} · {formatTime(c.raisedAt)}</div>
                    <div className="complaint-title">{cat.emoji} {c.title}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    <StatusBadge status={c.status} />
                    <SeverityBadge severity={c.severity} />
                  </div>
                </div>
                <div className="complaint-body">{c.description.slice(0, 120)}{c.description.length > 120 ? '...' : ''}</div>
                <div className="complaint-footer">
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span className="complaint-meta"><MessageSquare size={12} /> {c.customerName}</span>
                    <span className="complaint-meta">Worker: {c.workerName}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <ComplaintTypeBadge type={c.type} />
                    {c.responses.length > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.responses.length} response{c.responses.length > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <ComplaintDetailModal
          complaint={selected}
          onClose={() => setSelected(null)}
          onRespond={addComplaintResponse}
          onResolve={resolveComplaint}
          onEscalate={escalateComplaint}
        />
      )}
    </div>
  );
};

export default ComplaintsPage;
