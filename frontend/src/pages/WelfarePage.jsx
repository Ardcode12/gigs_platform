import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { WELFARE_SCHEMES, getInitials, getAvatarColor, formatCurrency, formatDate, getCategoryInfo } from '../constants';
import { Heart, Plus, CheckCircle, X, Shield, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';

// ============== Enroll Modal ==============
const EnrollModal = ({ onClose, workers, enrollments, onEnroll }) => {
  const [workerId, setWorkerId] = useState('');
  const [schemeId, setSchemeId] = useState('');

  const activeWorkers = workers.filter(w => w.kycStatus === 'active');
  const existingSchemes = (wId) => enrollments.filter(e => e.workerId === wId).map(e => e.schemeId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Enroll Worker in Welfare Scheme</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Select Worker</label>
            <select className="form-select" value={workerId} onChange={e => setWorkerId(e.target.value)}>
              <option value="">Choose worker...</option>
              {activeWorkers.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({getCategoryInfo(w.category)?.label})</option>
              ))}
            </select>
          </div>
          {workerId && (
            <div className="form-group">
              <label className="form-label">Select Scheme</label>
              {WELFARE_SCHEMES.map(s => {
                const already = existingSchemes(workerId).includes(s.id);
                return (
                  <div key={s.id}
                    onClick={() => !already && setSchemeId(s.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                      border: `1.5px solid ${schemeId === s.id ? 'var(--primary)' : already ? 'var(--success)' : 'var(--border)'}`,
                      borderRadius: 10, cursor: already ? 'default' : 'pointer', marginBottom: 8,
                      background: already ? 'var(--success-light)' : schemeId === s.id ? 'var(--primary-light)' : 'var(--surface)',
                      opacity: already ? 0.7 : 1,
                      transition: 'all 0.15s',
                    }}>
                    <span style={{ fontSize: 24 }}>{s.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.description}</div>
                    </div>
                    {already && <span className="badge badge-success" style={{ fontSize: 10 }}>✓ Enrolled</span>}
                    {schemeId === s.id && !already && <CheckCircle size={18} color="var(--primary)" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" disabled={!workerId || !schemeId} onClick={() => { onEnroll(workerId, schemeId); onClose(); }}>
            <Heart size={16} /> Enroll Now
          </button>
        </div>
      </div>
    </div>
  );
};

// ============== Advance Modal ==============
const AdvanceModal = ({ onClose, workers }) => {
  const [workerId, setWorkerId] = useState('');
  const [amount, setAmount] = useState(2000);
  const [reason, setReason] = useState('');

  const activeWorkers = workers.filter(w => w.kycStatus === 'active');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Apply Emergency Advance</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="alert alert-warning mb-4">
            <Shield size={14} />
            Advances are recovered from upcoming job payouts. Max advance: ₹10,000 per worker.
          </div>
          <div className="form-group">
            <label className="form-label">Worker</label>
            <select className="form-select" value={workerId} onChange={e => setWorkerId(e.target.value)}>
              <option value="">Select worker...</option>
              {activeWorkers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Advance Amount (₹)</label>
            <input className="form-input" type="number" min="500" max="10000" step="500" value={amount} onChange={e => setAmount(Number(e.target.value))} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Range: ₹500 – ₹10,000</div>
          </div>
          <div className="form-group">
            <label className="form-label">Reason for Advance</label>
            <textarea className="form-textarea" placeholder="Medical emergency, school fees, tool purchase..." value={reason} onChange={e => setReason(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-warning" disabled={!workerId || !reason || amount < 500}>
            <DollarSign size={16} /> Submit Advance Request
          </button>
        </div>
      </div>
    </div>
  );
};

// ============== Main Welfare Page ==============
const WelfarePage = () => {
  const { workers, welfare, enrollWorker, approveAdvance } = useSociety();
  const [showEnroll, setShowEnroll] = useState(false);
  const [showAdvance, setShowAdvance] = useState(false);
  const [activeTab, setActiveTab] = useState('schemes');

  const enrolledWorkerIds = [...new Set(welfare.enrollments.map(e => e.workerId))];
  const unenrolledCount = workers.filter(w => w.kycStatus === 'active' && !enrolledWorkerIds.includes(w.id)).length;

  return (
    <div className="page-body fade-in">
      {/* Scheme overview */}
      <div className="grid-2" style={{ gap: 16, marginBottom: 24 }}>
        {WELFARE_SCHEMES.map(s => {
          const count = welfare.enrollments.filter(e => e.schemeId === s.id).length;
          return (
            <div key={s.id} className="welfare-card">
              <div className="welfare-icon" style={{ background: s.bg, color: s.color, fontSize: 24 }}>{s.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 8px' }}>{s.description}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="badge badge-primary">{count} enrolled</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {unenrolledCount > 0 && (
        <div className="alert alert-warning mb-4">
          <Shield size={14} />
          <span><strong>{unenrolledCount} active workers</strong> have no welfare scheme enrollment. Enroll them for government benefits coverage.</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
          {[
            { id: 'schemes', label: '🛡️ Enrollments', count: welfare.enrollments.length },
            { id: 'advances', label: '💵 Advances', count: welfare.advances.length },
          ].map(t => (
            <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.label} <span className="tab-count">{t.count}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowEnroll(true)}>
            <Plus size={13} /> Enroll Worker
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdvance(true)}>
            <DollarSign size={13} /> Request Advance
          </button>
        </div>
      </div>

      {activeTab === 'schemes' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Scheme</th>
                  <th>Enrolled On</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {welfare.enrollments.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No enrollments yet</td></tr>
                ) : welfare.enrollments.map((e, i) => {
                  const scheme = WELFARE_SCHEMES.find(s => s.id === e.schemeId);
                  return (
                    <tr key={i}>
                      <td>
                        <div className="worker-cell">
                          <div className="worker-avatar" style={{ background: getAvatarColor(e.workerName), width: 32, height: 32, fontSize: 12 }}>{getInitials(e.workerName)}</div>
                          <span style={{ fontWeight: 600 }}>{e.workerName}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{scheme?.icon}</span> {scheme?.name}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(e.enrolledAt)}</td>
                      <td><span className="badge badge-success">✓ Active</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'advances' && (
        <div className="card">
          <div style={{ padding: '8px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {welfare.advances.length === 0 ? (
              <div className="empty-state">
                <div className="empty-title">No advance requests</div>
              </div>
            ) : welfare.advances.map(a => (
              <div key={a.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{a.workerName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.id} · Requested {formatDate(a.requestedAt)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{formatCurrency(a.amount)}</div>
                    <span className={`badge ${a.status === 'approved' ? 'badge-success' : a.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                      {a.status === 'approved' ? '✓ Approved' : a.status === 'pending' ? '⏳ Pending' : '❌ Rejected'}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>📋 {a.reason}</div>
                {a.status === 'approved' && (
                  <div style={{ background: 'var(--success-light)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#065F46' }}>
                    💳 Disbursed · Recovering ₹{formatCurrency(a.remaining || a.amount)} from upcoming payouts
                  </div>
                )}
                {a.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-success btn-sm" onClick={() => approveAdvance(a.id)}>
                      <CheckCircle size={12} /> Approve
                    </button>
                    <button className="btn btn-danger btn-sm">Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showEnroll && (
        <EnrollModal workers={workers} enrollments={welfare.enrollments} onClose={() => setShowEnroll(false)} onEnroll={enrollWorker} />
      )}
      {showAdvance && (
        <AdvanceModal workers={workers} onClose={() => setShowAdvance(false)} />
      )}
    </div>
  );
};

export default WelfarePage;
