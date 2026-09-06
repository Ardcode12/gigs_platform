import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { WORKER_CATEGORIES, JOB_STATUS, getCategoryInfo, getInitials, getAvatarColor, formatCurrency, formatTime } from '../constants';
import { MapPin, Clock, User, Users, CheckCircle, X, Navigation, Phone, Zap } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const map = {
    pending: ['badge-warning', '⏳ Pending'],
    dispatched: ['badge-sky', '🚀 Dispatched'],
    on_the_way: ['badge-primary', '🛣️ On the Way'],
    arrived: ['badge-teal', '📍 Arrived'],
    in_progress: ['badge-orange', '🔧 In Progress'],
    completed: ['badge-success', '✅ Completed'],
    cancelled: ['badge-danger', '❌ Cancelled'],
  };
  const [cls, label] = map[status] || ['badge-muted', status];
  return <span className={`badge ${cls}`}>{label}</span>;
};

function distanceKm(fromLat, fromLng, toLat, toLng) {
  if (![fromLat, fromLng, toLat, toLng].every(Number.isFinite)) return null;
  const radians = (value) => (value * Math.PI) / 180;
  const dLat = radians(toLat - fromLat);
  const dLng = radians(toLng - fromLng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(fromLat)) * Math.cos(radians(toLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============== Single Assign Modal ==============
const AssignSingleModal = ({ booking, availableWorkers, onClose, onAssign }) => {
  const [selected, setSelected] = useState(null);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Assign Worker — {booking.id}</div>
            <div className="modal-sub">{getCategoryInfo(booking.serviceCategory)?.emoji} {getCategoryInfo(booking.serviceCategory)?.label} · {booking.customerAddress}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="alert alert-info mb-4">
            <Navigation size={14} />
            Workers are sorted by proximity to customer location. Select the best available worker.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {availableWorkers.map((w, i) => {
              const distanceValue = distanceKm(booking.lat, booking.lng, w.lastLat, w.lastLng);
              const distance = distanceValue == null ? null : distanceValue.toFixed(1);
              return (
                <div key={w.id}
                  onClick={() => setSelected(w.id)}
                  style={{
                    border: `1.5px solid ${selected === w.id ? 'var(--primary)' : 'var(--border)'}`,
                    background: selected === w.id ? 'var(--primary-light)' : 'var(--surface)',
                    borderRadius: 12, padding: 14, cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {i === 0 && <span className="badge badge-success" style={{ fontSize: 10, marginRight: -4 }}>Nearest</span>}
                    <div className="worker-avatar" style={{ background: getAvatarColor(w.name) }}>{getInitials(w.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{w.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{w.city} · ⭐ {w.rating || 'New'} · {w.completedJobs} jobs</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>📍 {distance ? `${distance} km` : 'Location unavailable'}</div>
                       {distance && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>~{Math.round(Number(distance) * 4)} min ETA</div>}
                    </div>
                    {selected === w.id && <CheckCircle size={20} color="var(--primary)" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!selected} onClick={() => { onAssign(booking.id, selected); onClose(); }}>
            <CheckCircle size={16} /> Confirm Assignment
          </button>
        </div>
      </div>
    </div>
  );
};

// ============== Bulk Assign Modal ==============
const AssignBulkModal = ({ booking, availableWorkers, onClose, onAssign }) => {
  const [selected, setSelected] = useState([]);
  const [lead, setLead] = useState(null);
  const maxNeeded = booking.teamSize || 5;

  const toggle = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < maxNeeded ? [...prev, id] : prev
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Assign Bulk Team — {booking.id}</div>
            <div className="modal-sub">{getCategoryInfo(booking.serviceCategory)?.emoji} {getCategoryInfo(booking.serviceCategory)?.label} · Need {maxNeeded} workers</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="alert alert-info mb-4">
            <Users size={14} />
            Select exactly <strong>{maxNeeded} workers</strong> and designate one as Team Lead. Customer will pay to Society account, and you can split payouts in the Payments module.
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Select Team ({selected.length}/{maxNeeded})</span>
            {selected.length === maxNeeded && <span className="badge badge-success">Team Complete!</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
            {availableWorkers.map(w => (
              <div key={w.id}
                style={{
                  border: `1.5px solid ${selected.includes(w.id) ? 'var(--primary)' : 'var(--border)'}`,
                  background: selected.includes(w.id) ? 'var(--primary-light)' : 'var(--surface)',
                  borderRadius: 10, padding: 12, cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
                onClick={() => toggle(w.id)}>
                <div className="worker-avatar" style={{ width: 34, height: 34, fontSize: 13, background: getAvatarColor(w.name) }}>{getInitials(w.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{w.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>⭐ {w.rating || 'New'} · {w.completedJobs} jobs</div>
                </div>
                {selected.includes(w.id) && (
                  <select className="form-select" style={{ width: 120, fontSize: 11, padding: '4px 8px' }}
                    value={lead === w.id ? 'lead' : 'member'}
                    onChange={e => setLead(e.target.value === 'lead' ? w.id : lead === w.id ? null : lead)}
                    onClick={e => e.stopPropagation()}>
                    <option value="member">Member</option>
                    <option value="lead">Team Lead</option>
                  </select>
                )}
                {selected.includes(w.id) && <CheckCircle size={18} color="var(--primary)" />}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={selected.length === 0} onClick={() => { onAssign(booking.id, selected, lead); onClose(); }}>
            <Users size={16} /> Dispatch Team ({selected.length})
          </button>
        </div>
      </div>
    </div>
  );
};

// ============== Main Bookings Page ==============
const BookingsPage = () => {
  const { bookings, workers, assignWorker, assignBulkTeam, updateBookingStatus } = useSociety();
  const [activeTab, setActiveTab] = useState('incoming');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [assignModal, setAssignModal] = useState(null);
  const [assignBulkModal, setAssignBulkModal] = useState(null);

  const filtered = bookings.filter(b => {
    const matchesCat = !categoryFilter || b.serviceCategory === categoryFilter;
    const matchesTab =
      activeTab === 'incoming' ? b.status === 'pending' :
      activeTab === 'active' ? ['dispatched', 'on_the_way', 'arrived', 'in_progress'].includes(b.status) :
      activeTab === 'bulk' ? b.type === 'bulk' :
      activeTab === 'completed' ? b.status === 'completed' : true;
    return matchesCat && matchesTab;
  });

  const tabs = [
    { id: 'incoming', label: '📥 Incoming', count: bookings.filter(b => b.status === 'pending').length },
    { id: 'active', label: '🔧 Active', count: bookings.filter(b => ['dispatched', 'on_the_way', 'in_progress'].includes(b.status)).length },
    { id: 'bulk', label: '👥 Bulk Orders', count: bookings.filter(b => b.type === 'bulk').length },
    { id: 'completed', label: '✅ Completed', count: bookings.filter(b => b.status === 'completed').length },
    { id: 'all', label: 'All', count: bookings.length },
  ];

  const getAvailableForCategory = (category) =>
    workers.filter(w => w.category === category && w.kycStatus === 'active' && w.availability === 'available');

  const getWorkerById = (id) => workers.find(w => w.id === id);

  return (
    <div className="page-body fade-in">
      {/* Live worker availability strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Available', count: workers.filter(w => w.availability === 'available' && w.kycStatus === 'active').length, color: 'var(--success)', dot: 'online' },
          { label: 'Dispatched', count: workers.filter(w => w.availability === 'dispatched').length, color: 'var(--sky)', dot: 'busy' },
          { label: 'On Job', count: workers.filter(w => w.availability === 'on_job').length, color: 'var(--warning)', dot: 'busy' },
          { label: 'Offline', count: workers.filter(w => w.availability === 'offline').length, color: 'var(--text-muted)', dot: 'offline' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`online-dot ${s.dot}`} />
            <span style={{ fontWeight: 700, fontSize: 18, color: s.color }}>{s.count}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
          </div>
        ))}
        <div className="card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <select className="form-select" style={{ border: 'none', outline: 'none', padding: 0, background: 'none', fontSize: 13 }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All Services</option>
            {WORKER_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Booking & Dispatch Center</div>
            <div className="card-subtitle">Manage single jobs and bulk team orders, assign nearest workers by GPS</div>
          </div>
          <span className="badge badge-danger" style={{ fontSize: 12, padding: '5px 12px' }}>
            <Zap size={12} /> {bookings.filter(b => b.status === 'pending').length} Incoming
          </span>
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

        <div style={{ padding: '8px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Clock size={40} /></div>
              <div className="empty-title">No bookings here</div>
              <div className="empty-desc">Customer requests will appear as they come in.</div>
            </div>
          ) : filtered.map(b => {
            const cat = getCategoryInfo(b.serviceCategory);
            const assignedW = b.assignedWorker ? getWorkerById(b.assignedWorker) : null;
            const assignedTeam = b.assignedWorkers?.map(id => getWorkerById(id)).filter(Boolean) || [];
            const availableWorkers = getAvailableForCategory(b.serviceCategory);

            return (
              <div key={b.id} className="job-card">
                <div className="job-card-header">
                  <div>
                    <div className="job-id">{b.id} · {formatTime(b.requestedAt)}</div>
                    <div className="job-service">
                      {cat.emoji} {cat.label}
                      <span className={`badge ${b.type === 'bulk' ? 'badge-violet' : 'badge-sky'} job-type-badge`} style={{ marginLeft: 8 }}>
                        {b.type === 'bulk' ? `👥 Bulk (${b.teamSize})` : '👤 Single'}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <div style={{ fontSize: 13.5, fontWeight: 600, margin: '8px 0 4px' }}>{b.customerName}</div>
                <div className="job-meta">
                  <span className="job-meta-item"><MapPin size={13} /> {b.customerAddress}</span>
                  <span className="job-meta-item"><Phone size={13} /> {b.customerPhone}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0' }}>📋 {b.description}</div>

                {assignedW && (
                  <div style={{ background: 'var(--success-light)', borderRadius: 8, padding: '8px 12px', marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="worker-avatar" style={{ width: 30, height: 30, fontSize: 12, background: getAvatarColor(assignedW.name) }}>{getInitials(assignedW.name)}</div>
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#065F46' }}>Assigned: {assignedW.name} · {assignedW.city}</span>
                  </div>
                )}
                {assignedTeam.length > 0 && (
                  <div style={{ background: 'var(--violet-light)', borderRadius: 8, padding: '8px 12px', marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {assignedTeam.map(w => (
                      <span key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#5B21B6' }}>
                        {getInitials(w.name)} {w.name === getWorkerById(b.teamLead)?.name ? '(Lead)' : ''}
                      </span>
                    ))}
                  </div>
                )}

                <div className="job-footer">
                  <div className="job-amount">{formatCurrency(b.estimatedAmount)}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {b.status === 'pending' && b.type === 'single' && (
                      <button className="btn btn-primary btn-sm" onClick={() => setAssignModal(b)} disabled={availableWorkers.length === 0}>
                        <User size={13} /> {availableWorkers.length === 0 ? 'No Workers Available' : 'Assign Worker'}
                      </button>
                    )}
                    {b.status === 'pending' && b.type === 'bulk' && (
                      <button className="btn btn-primary btn-sm" onClick={() => setAssignBulkModal(b)} disabled={availableWorkers.length === 0}>
                        <Users size={13} /> Assign Team
                      </button>
                    )}
                    {b.status === 'dispatched' && (
                      <button className="btn btn-success btn-sm" onClick={() => updateBookingStatus(b.id, 'in_progress')}>
                        Mark In Progress
                      </button>
                    )}
                    {b.status === 'in_progress' && (
                      <button className="btn btn-success btn-sm" onClick={() => updateBookingStatus(b.id, 'completed')}>
                        Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {assignModal && (
        <AssignSingleModal
          booking={assignModal}
          availableWorkers={getAvailableForCategory(assignModal.serviceCategory)}
          onClose={() => setAssignModal(null)}
          onAssign={assignWorker}
        />
      )}
      {assignBulkModal && (
        <AssignBulkModal
          booking={assignBulkModal}
          availableWorkers={getAvailableForCategory(assignBulkModal.serviceCategory)}
          onClose={() => setAssignBulkModal(null)}
          onAssign={assignBulkTeam}
        />
      )}
    </div>
  );
};

export default BookingsPage;
