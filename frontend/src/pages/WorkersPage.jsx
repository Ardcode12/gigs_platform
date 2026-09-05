import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { WORKER_CATEGORIES, getCategoryInfo, formatCurrency } from '../constants';
import { Plus, CheckCircle, Shield, X, Loader, Search, PhoneCall } from 'lucide-react';

const KycBadge = ({ status }) => {
  const map = {
    pending: ['badge-muted', '⏳ Pending'],
    verifying: ['badge-warning', '🔄 Verifying Refs'],
    gov_certified: ['badge-success', '🏛️ Gov Certified'],
    inspection_required: ['badge-warning', '🔍 Needs Inspection'],
    inspection_passed: ['badge-teal', '✅ Inspection Passed'],
    rejected: ['badge-danger', '❌ Rejected'],
    active: ['badge-success', '✅ Active'],
  };
  const [cls, label] = map[status] || ['badge-muted', status];
  return <span className={`badge ${cls}`}>{label}</span>;
};

// ============== Register Worker Modal ==============
const RegisterWorkerModal = ({ onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', phone: '', category: '', skills: [],
    kycMethod: 'certificate', certId: '', voucherMemberName: '', voucherMemberPhone: ''
  });
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addSkill = () => {
    if (skillInput.trim() && !form.skills.includes(skillInput.trim())) {
      set('skills', [...form.skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (e) {
      alert(e.message || 'Error registering worker');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Register New Worker</div>
            <div className="modal-sub">Create worker profile & initiate KYC</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {step === 1 && (
            <div className="fade-in">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Primary Category *</label>
                <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                  <option value="">Select category</option>
                  {WORKER_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Skills (add individually)</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input className="form-input" style={{ flex: 1 }} value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()} />
                  <button className="btn btn-secondary" onClick={addSkill}>Add</button>
                </div>
                <div className="skill-tags">
                  {form.skills.map((s, i) => (
                    <span key={i} className="skill-tag" onClick={() => set('skills', form.skills.filter((_, j) => j !== i))}>
                      {s} <X size={11} />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-in">
              <div className="alert alert-info mb-4">
                <Shield size={14} />
                <span>Select verification route for this worker.</span>
              </div>
              <div className="form-group">
                <label className="form-label">KYC Method *</label>
                <select className="form-select" value={form.kycMethod} onChange={e => set('kycMethod', e.target.value)}>
                  <option value="certificate">Government Skill Certificate</option>
                  <option value="community_voucher">Community Voucher (No Cert)</option>
                </select>
              </div>

              {form.kycMethod === 'certificate' ? (
                <div className="form-group">
                  <label className="form-label">Certificate ID (Optional)</label>
                  <input className="form-input" placeholder="e.g. ITI-TN-2021-0045" value={form.certId} onChange={e => set('certId', e.target.value)} />
                </div>
              ) : (
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Voucher Member Name *</label>
                    <input className="form-input" value={form.voucherMemberName} onChange={e => set('voucherMemberName', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Voucher Member Phone *</label>
                    <input className="form-input" value={form.voucherMemberPhone} onChange={e => set('voucherMemberPhone', e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
          {step > 1 ? (
            <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>Back</button>
          ) : <div />}
          {step < 2 ? (
            <button className="btn btn-primary" onClick={() => setStep(s => s + 1)} disabled={!form.name || !form.phone || !form.category}>Next</button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader size={16} className="spinner" /> : 'Register Worker'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============== Main Page ==============
const WorkersPage = () => {
  const { workers, registerWorker, submitKycRefs, approveKyc, rejectKyc } = useSociety();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [selectedWorker, setSelectedWorker] = useState(null);

  // KYC Refs State
  const [refs, setRefs] = useState([{ refName: '', refPhone: '' }, { refName: '', refPhone: '' }]);

  const filtered = workers.filter(w => {
    const matchesSearch = w.name?.toLowerCase().includes(searchTerm.toLowerCase()) || w.phone?.includes(searchTerm);
    const matchesCat = filterCat === 'all' || w.category === filterCat;
    return matchesSearch && matchesCat;
  });

  const handleRegister = async (data) => {
    const worker = await registerWorker(data);
    alert(`Worker registered successfully!\nUnique ID: ${worker.uniqueId}\nDefault Password: ${worker.defaultPassword}\n\nPlease note these credentials.`);
  };

  const handleSubmitRefs = async () => {
    if (!selectedWorker) return;
    await submitKycRefs(selectedWorker.id, { refs: refs.filter(r => r.refPhone) });
    alert('References submitted for verification.');
    setSelectedWorker(null);
  };

  const handleApprove = async () => {
    if (!selectedWorker) return;
    await approveKyc(selectedWorker.id);
    alert('Worker approved and activated.');
    setSelectedWorker(null);
  };

  return (
    <div className="page-body fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>Workers Directory</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Manage society workers & KYC</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Worker
        </button>
      </div>

      <div className="filters-bar" style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div className="search-box" style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search name or phone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 200 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="all">All Categories</option>
          {WORKER_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      <div className="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Worker Details</th>
              <th>Category</th>
              <th>KYC Status</th>
              <th>Rating / Jobs</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(w => {
              const cat = getCategoryInfo(w.category);
              return (
                <tr key={w.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{w.uniqueId}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{w.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{w.phone}</div>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>{cat.emoji}</span> {cat.label}
                    </span>
                  </td>
                  <td><KycBadge status={w.kycStatus} /></td>
                  <td>⭐ {w.ratingAvg} ({w.completedJobs} jobs)</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelectedWorker(w)}>
                      View / KYC
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No workers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && <RegisterWorkerModal onClose={() => setShowModal(false)} onSubmit={handleRegister} />}

      {/* Selected Worker Modal */}
      {selectedWorker && (
        <div className="modal-overlay" onClick={() => setSelectedWorker(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Worker KYC Review</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedWorker(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <strong>{selectedWorker.name}</strong> ({selectedWorker.uniqueId}) <br/>
                Status: <KycBadge status={selectedWorker.kycStatus} />
              </div>

              {selectedWorker.kycStatus === 'pending' && (
                <div className="card" style={{ padding: 16, background: 'var(--bg)', marginBottom: 16 }}>
                  <h4>Step 2: Collect Client References</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Please enter at least 2 phone numbers of past clients for this worker.
                  </p>
                  {refs.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input className="form-input" placeholder="Name" value={r.refName} onChange={e => {
                        const newRefs = [...refs]; newRefs[i].refName = e.target.value; setRefs(newRefs);
                      }} />
                      <input className="form-input" placeholder="Phone *" value={r.refPhone} onChange={e => {
                        const newRefs = [...refs]; newRefs[i].refPhone = e.target.value; setRefs(newRefs);
                      }} />
                    </div>
                  ))}
                  <button className="btn btn-primary" onClick={handleSubmitRefs} disabled={!refs.some(r => r.refPhone)}>Submit References</button>
                </div>
              )}

              {selectedWorker.kycStatus === 'verifying' && (
                <div className="card" style={{ padding: 16, background: 'var(--bg)', marginBottom: 16 }}>
                  <h4>Verification in Progress</h4>
                  <p style={{ fontSize: 13 }}>Society head must manually verify the submitted references or documents.</p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <button className="btn btn-success" onClick={handleApprove}>Approve & Activate</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkersPage;
