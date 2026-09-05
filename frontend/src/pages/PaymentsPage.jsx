import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { formatCurrency, formatDate, formatTime, getInitials, getAvatarColor } from '../constants';
import { DollarSign, CheckCircle, X, AlertCircle, ArrowRight, Split } from 'lucide-react';

const PayStatusBadge = ({ status }) => {
  const map = {
    pending: ['badge-warning', '⏳ Pending'],
    online_paid: ['badge-success', '💳 Online Paid'],
    cash_paid: ['badge-teal', '💵 Cash Paid'],
    reconciled: ['badge-success', '✅ Reconciled'],
    split_pending: ['badge-orange', '⏳ Split Pending'],
    split_done: ['badge-success', '✅ Split Done'],
  };
  const [cls, label] = map[status] || ['badge-muted', status];
  return <span className={`badge ${cls}`}>{label}</span>;
};

// ============== Cash Record Modal ==============
const CashRecordModal = ({ booking, workers, onClose, onRecord }) => {
  const [amount, setAmount] = useState(booking.estimatedAmount);
  const worker = workers.find(w => w.id === booking.assignedWorker);
  const fee = Math.round(amount * 0.08);
  const workerGet = amount - fee;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Record Cash Payment</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="alert alert-info mb-4">
            <DollarSign size={14} /> Customer paid cash to worker. Record it here to keep society accounts accurate.
          </div>
          {worker && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 10, marginBottom: 16 }}>
              <div className="worker-avatar" style={{ background: getAvatarColor(worker.name) }}>{getInitials(worker.name)}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{worker.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Worker · Received cash from customer</div>
              </div>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Cash Amount Paid (₹)</label>
            <input className="form-input" type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} />
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="split-row">
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total Amount</span>
              <span style={{ fontWeight: 700 }}>{formatCurrency(amount)}</span>
            </div>
            <div className="split-row">
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Society Fee (8%)</span>
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>−{formatCurrency(fee)}</span>
            </div>
            <div className="split-total">
              <span>Worker Gets</span>
              <span style={{ color: 'var(--success)', fontSize: 18 }}>{formatCurrency(workerGet)}</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" onClick={() => { onRecord(booking.id, amount, booking.assignedWorker); onClose(); }}>
            <CheckCircle size={16} /> Confirm Cash Record
          </button>
        </div>
      </div>
    </div>
  );
};

// ============== Bulk Split Modal ==============
const BulkSplitModal = ({ payment, bookings, workers, onClose, onConfirm }) => {
  const booking = bookings.find(b => b.id === payment.bookingId);
  const teamWorkers = booking?.assignedWorkers?.map(id => workers.find(w => w.id === id)).filter(Boolean) || [];
  const societyFee = Math.round(payment.amount * 0.05);
  const netAmount = payment.amount - societyFee;
  const perWorker = teamWorkers.length > 0 ? Math.floor(netAmount / teamWorkers.length) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Bulk Payment Split</div>
            <div className="modal-sub">{payment.id} · {payment.customerName}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="alert alert-success mb-4">
            <CheckCircle size={14} />
            Customer payment of <strong>{formatCurrency(payment.amount)}</strong> received in Society account. Now split it among the {teamWorkers.length} workers.
          </div>

          <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div className="split-row">
              <span style={{ fontWeight: 600 }}>Total Received</span>
              <span style={{ fontWeight: 800, fontSize: 17 }}>{formatCurrency(payment.amount)}</span>
            </div>
            <div className="split-row">
              <span style={{ color: 'var(--text-secondary)' }}>Society Commission (5%)</span>
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>−{formatCurrency(societyFee)}</span>
            </div>
            <div className="split-row">
              <span style={{ color: 'var(--text-secondary)' }}>Net for Workers ({teamWorkers.length})</span>
              <span style={{ fontWeight: 700 }}>{formatCurrency(netAmount)}</span>
            </div>
            <div className="split-total">
              <span style={{ fontSize: 15, fontWeight: 700 }}>Per Worker</span>
              <span style={{ color: 'var(--success)', fontSize: 22, fontWeight: 800 }}>{formatCurrency(perWorker)}</span>
            </div>
          </div>

          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Team Members</div>
          {teamWorkers.map(w => (
            <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="worker-avatar" style={{ width: 34, height: 34, fontSize: 13, background: getAvatarColor(w.name) }}>{getInitials(w.name)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{w.name} {w.id === booking.teamLead ? '👑 Lead' : ''}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.phone}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(perWorker)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Via UPI / Bank</div>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" />
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" onClick={() => { onConfirm(payment.bookingId); onClose(); }}>
            <Split size={16} /> Confirm Split & Transfer
          </button>
        </div>
      </div>
    </div>
  );
};

// ============== Main Payments Page ==============
const PaymentsPage = () => {
  const { bookings, payments, workers, recordCashPayment, confirmSplitPayout } = useSociety();
  const [activeTab, setActiveTab] = useState('all');
  const [cashModal, setCashModal] = useState(null);
  const [splitModal, setSplitModal] = useState(null);

  const completedBookings = bookings.filter(b => b.status === 'completed' && b.paymentStatus === 'pending');
  const splitPending = payments.filter(p => p.status === 'split_pending');
  const allPaid = payments.filter(p => ['online_paid', 'cash_paid', 'reconciled', 'split_done'].includes(p.status));

  const todayTotal = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const commissionTotal = payments.reduce((acc, p) => acc + Math.round((p.amount || 0) * 0.07), 0);

  return (
    <div className="page-body fade-in">
      {/* Summary strip */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total Collected', value: formatCurrency(todayTotal), color: '#2563EB', bg: '#DBEAFE', icon: '💰' },
          { label: 'Society Commission', value: formatCurrency(commissionTotal), color: '#10B981', bg: '#D1FAE5', icon: '🏦' },
          { label: 'Cash Pending', value: completedBookings.length, color: '#F59E0B', bg: '#FEF3C7', icon: '💵', suffix: 'jobs' },
          { label: 'Split Pending', value: splitPending.length, color: '#8B5CF6', bg: '#EDE9FE', icon: '⚡', suffix: 'payouts' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg, color: s.color, fontSize: 20 }}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{s.value}{s.suffix ? ` ${s.suffix}` : ''}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Cash Reconciliation */}
      {completedBookings.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <div>
              <div className="card-title">💵 Cash Payment Reconciliation</div>
              <div className="card-subtitle">Completed jobs awaiting cash payment record</div>
            </div>
            <span className="badge badge-warning">{completedBookings.length} pending</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Worker</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {completedBookings.map(b => {
                  const w = workers.find(wk => wk.id === b.assignedWorker);
                  return (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 12 }}>{b.id}</td>
                      <td>{b.customerName}</td>
                      <td>{w ? `${w.name}` : '—'}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(b.estimatedAmount)}</td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => setCashModal(b)}>
                          <DollarSign size={12} /> Record Cash
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Splits */}
      {splitPending.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <div>
              <div className="card-title">⚡ Bulk Payout Splits</div>
              <div className="card-subtitle">Customer paid Society — split and transfer to each worker</div>
            </div>
            <span className="badge badge-orange">{splitPending.length} pending</span>
          </div>
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {splitPending.map(p => {
              const b = bookings.find(bk => bk.id === p.bookingId);
              const teamSize = b?.assignedWorkers?.length || p.workerCount || 0;
              return (
                <div key={p.id} style={{ border: '1.5px solid var(--warning)', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.customerName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.id} · {teamSize} workers · {formatTime(p.paidAt)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{formatCurrency(p.amount)}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>≈ {formatCurrency(Math.floor((p.amount * 0.95) / Math.max(1, teamSize)))} per worker</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => setSplitModal(p)}>
                    <Split size={12} /> Split Now
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Transaction History</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Booking</th>
                <th>Customer / Worker</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No transactions yet</td></tr>
              ) : payments.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 11 }}>{p.id}</td>
                  <td style={{ fontSize: 12 }}>{p.bookingId}</td>
                  <td>{p.customerName}</td>
                  <td>
                    <span className={`badge ${p.type === 'bulk' ? 'badge-violet' : 'badge-sky'}`}>
                      {p.type === 'bulk' ? '👥 Bulk' : '👤 Single'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(p.amount)}</td>
                  <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{p.mode || '—'}</td>
                  <td><PayStatusBadge status={p.status} /></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(p.paidAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {cashModal && (
        <CashRecordModal booking={cashModal} workers={workers} onClose={() => setCashModal(null)} onRecord={recordCashPayment} />
      )}
      {splitModal && (
        <BulkSplitModal payment={splitModal} bookings={bookings} workers={workers} onClose={() => setSplitModal(null)} onConfirm={confirmSplitPayout} />
      )}
    </div>
  );
};

export default PaymentsPage;
