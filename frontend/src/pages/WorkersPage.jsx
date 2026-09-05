import React, { useState, useRef, useEffect } from 'react';
import { useSociety } from '../context/SocietyContext';
import { WORKER_CATEGORIES, getCategoryInfo, formatCurrency } from '../constants';
import {
  Plus, CheckCircle, Shield, X, Loader, Search, Phone, MapPin,
  Building, CreditCard, User, AlertCircle, Camera, Upload, Trash2,
  RefreshCw, CheckCircle2, ExternalLink
} from 'lucide-react';

const KycBadge = ({ status, method }) => {
  if (status === 'active' || status === 'gov_certified' || status === 'completed') {
    return (
      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <CheckCircle2 size={13} /> {method === 'certificate' ? 'Completed (Gov Cert)' : 'KYC Completed'}
      </span>
    );
  }
  if (status === 'verifying') {
    return (
      <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <RefreshCw size={13} /> Verifying Client Refs
      </span>
    );
  }
  if (status === 'rejected') {
    return <span className="badge badge-danger">❌ KYC Rejected</span>;
  }
  return <span className="badge badge-muted">⏳ Pending KYC</span>;
};

// ============== Camera Capture Component ==============
const CameraCapture = ({ photoUrl, onPhotoCaptured, onPhotoRemoved }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported by your browser. Please use photo upload.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(err.message || 'Could not access camera. Please allow permission or upload a photo.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    stopCamera();
    onPhotoCaptured(dataUrl);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG/JPG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      onPhotoCaptured(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="photo-capture-box" style={{ background: 'var(--bg-secondary, #f8fafc)', border: '1px dashed #cbd5e1', borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <label className="form-label" style={{ margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Camera size={16} color="var(--primary, #2563eb)" /> Worker Live Photo *
        </label>
        {photoUrl && (
          <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={14} /> Photo Captured
          </span>
        )}
      </div>

      {cameraError && (
        <div className="alert alert-danger" style={{ fontSize: 12, padding: '8px 12px', marginBottom: 10 }}>
          <AlertCircle size={14} /> {cameraError}
        </div>
      )}

      {/* When camera is active */}
      {cameraActive ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 360, margin: '0 auto', borderRadius: 10, overflow: 'hidden', background: '#000', border: '2px solid #2563eb' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', display: 'block' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
            <button type="button" className="btn btn-primary" onClick={capturePhoto} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Camera size={16} /> Take Snapshot
            </button>
            <button type="button" className="btn btn-secondary" onClick={stopCamera}>
              Cancel Camera
            </button>
          </div>
        </div>
      ) : photoUrl ? (
        /* Photo preview */
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img
            src={photoUrl}
            alt="Worker"
            style={{ width: 84, height: 84, borderRadius: 10, objectFit: 'cover', border: '2px solid #2563eb', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Worker Photo Ready</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Captured for KYC verification</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={startCamera} style={{ fontSize: 12, padding: '4px 10px' }}>
                <RefreshCw size={12} /> Retake
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={onPhotoRemoved} style={{ fontSize: 12, padding: '4px 10px' }}>
                <Trash2 size={12} /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Action buttons to start camera or upload */
        <div style={{ textAlign: 'center', padding: '16px 8px' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px' }}>
            Take photo using live camera access or upload an image file
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={startCamera} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <Camera size={16} /> Access Camera & Take Photo
            </button>
            <label className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', margin: 0 }}>
              <Upload size={16} /> Upload Photo File
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      )}

      {/* Hidden canvas for taking snapshot */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

// ============== Register Worker Modal ==============
const RegisterWorkerModal = ({ onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [skillInput, setSkillInput] = useState('');

  const [form, setForm] = useState({
    // Worker Personal Info
    photoUrl: '',
    name: '',
    age: '',
    address: '',
    phone: '',
    email: '',
    category: '',
    skills: [],
    // Bank Details
    bankAccountNo: '',
    bankIfsc: '',
    bankName: '',
    // Verification
    kycMethod: 'certificate', // 'certificate' | 'community_voucher'
    certId: '',
    certAuthority: '',
    // Client References (with name, 10-digit phone, and current address)
    clientRefs: [
      { refName: '', refPhone: '', refAddress: '' },
      { refName: '', refPhone: '', refAddress: '' },
    ],
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setClientRef = (index, field, value) => {
    setForm(f => {
      const updated = [...f.clientRefs];
      updated[index] = { ...updated[index], [field]: value };
      return { ...f, clientRefs: updated };
    });
  };

  const addClientRefRow = () => {
    setForm(f => ({
      ...f,
      clientRefs: [...f.clientRefs, { refName: '', refPhone: '', refAddress: '' }],
    }));
  };

  const removeClientRefRow = (index) => {
    if (form.clientRefs.length <= 1) return;
    setForm(f => ({
      ...f,
      clientRefs: f.clientRefs.filter((_, i) => i !== index),
    }));
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      set('skills', [...form.skills, s]);
      setSkillInput('');
    }
  };

  const removeSkill = (index) => {
    set('skills', form.skills.filter((_, i) => i !== index));
  };

  // Step 1 Validation
  const validateStep1 = () => {
    setValidationError('');
    if (!form.photoUrl) {
      setValidationError('Please take or upload the worker photo before proceeding.');
      return false;
    }
    if (!form.name.trim()) {
      setValidationError('Worker full name is required.');
      return false;
    }
    if (!form.age || isNaN(form.age) || parseInt(form.age) < 18 || parseInt(form.age) > 80) {
      setValidationError('Please enter a valid age between 18 and 80.');
      return false;
    }
    if (!form.address.trim()) {
      setValidationError('Worker current address is required.');
      return false;
    }
    const cleanPhone = String(form.phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setValidationError('Worker phone number must contain exactly 10 digits.');
      return false;
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    setValidationError('');
    if (!form.category) {
      setValidationError('Please select the primary work category.');
      return false;
    }
    if (!form.bankAccountNo.trim()) {
      setValidationError('Bank account number is required.');
      return false;
    }
    if (!form.bankIfsc.trim()) {
      setValidationError('Bank IFSC code is required.');
      return false;
    }
    if (!form.bankName.trim()) {
      setValidationError('Bank name & branch is required.');
      return false;
    }
    return true;
  };

  // Final Submit Validation
  const handleFinalSubmit = async () => {
    setValidationError('');
    if (form.kycMethod === 'certificate') {
      if (!form.certId.trim()) {
        setValidationError('Certificate ID or Trade Registration number is required for Government Certification.');
        return;
      }
    } else {
      // Client reference validation: at least 1 reference with name, 10-digit phone, and current address
      const validRefs = form.clientRefs.filter(r => r.refName.trim() || r.refPhone.trim() || r.refAddress.trim());
      if (validRefs.length === 0) {
        setValidationError('Please provide at least 1 client reference with name, 10-digit phone number, and current address.');
        return;
      }
      for (const r of validRefs) {
        if (!r.refName.trim()) {
          setValidationError('Client reference name is required.');
          return;
        }
        const cleanRefPhone = String(r.refPhone || '').replace(/\D/g, '');
        if (cleanRefPhone.length !== 10) {
          setValidationError(`Phone number for reference "${r.refName}" must contain exactly 10 digits.`);
          return;
        }
        if (!r.refAddress.trim()) {
          setValidationError(`Current address for reference "${r.refName}" is required.`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        age: parseInt(form.age, 10),
        address: form.address.trim(),
        phone: String(form.phone).replace(/\D/g, ''),
        email: form.email ? form.email.trim() : null,
        category: form.category,
        skills: form.skills,
        photoUrl: form.photoUrl,
        bankAccountNo: form.bankAccountNo.trim(),
        bankIfsc: form.bankIfsc.trim().toUpperCase(),
        bankName: form.bankName.trim(),
        bankDetails: {
          accountNumber: form.bankAccountNo.trim(),
          ifsc: form.bankIfsc.trim().toUpperCase(),
          bankName: form.bankName.trim(),
        },
        kycMethod: form.kycMethod,
        certId: form.certId ? form.certId.trim() : null,
        clientRefs: form.clientRefs
          .filter(r => r.refPhone && r.refName)
          .map(r => ({
            refName: r.refName.trim(),
            refPhone: String(r.refPhone).replace(/\D/g, ''),
            refAddress: r.refAddress.trim(),
          })),
      };

      await onSubmit(payload);
      onClose();
    } catch (e) {
      setValidationError(e.response?.data?.message || e.message || 'Error registering worker.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Register New Worker</div>
            <div className="modal-sub">Step {step} of 3 — Complete worker profile & KYC registration</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Step Progress Indicators */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border, #e2e8f0)', padding: '10px 20px', background: 'var(--bg-secondary, #f8fafc)', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: step === 1 ? '#2563eb' : '#64748b' }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: step === 1 ? '#2563eb' : '#cbd5e1', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>1</span>
            Photo & Identity
          </div>
          <span style={{ color: '#cbd5e1' }}>›</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: step === 2 ? '#2563eb' : '#64748b' }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: step === 2 ? '#2563eb' : '#cbd5e1', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>2</span>
            Work & Bank Details
          </div>
          <span style={{ color: '#cbd5e1' }}>›</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: step === 3 ? '#2563eb' : '#64748b' }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: step === 3 ? '#2563eb' : '#cbd5e1', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>3</span>
            KYC Verification
          </div>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '18px 20px' }}>
          {validationError && (
            <div className="alert alert-danger" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <AlertCircle size={16} />
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1: Photo & Identity */}
          {step === 1 && (
            <div className="fade-in">
              {/* Photo Capture */}
              <CameraCapture
                photoUrl={form.photoUrl}
                onPhotoCaptured={(url) => { set('photoUrl', url); setValidationError(''); }}
                onPhotoRemoved={() => set('photoUrl', '')}
              />

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Ramesh Kumar"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Age *</label>
                  <input
                    className="form-input"
                    type="number"
                    min="18"
                    max="80"
                    placeholder="e.g. 32"
                    value={form.age}
                    onChange={e => set('age', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Phone Number * (10 Digits)
                  </label>
                  <input
                    className="form-input"
                    type="tel"
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value.replace(/\D/g, ''))}
                    required
                  />
                  <div style={{ fontSize: 11, color: form.phone.length === 10 ? '#16a34a' : 'var(--text-muted)', marginTop: 4 }}>
                    {form.phone.length === 10 ? '✓ Valid 10-digit number' : `${form.phone.length}/10 digits entered`}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="e.g. worker@example.com"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Current Address *</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Enter worker's full current residence address (Door no, street, locality, city)..."
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 2: Work They Know & Bank Details */}
          {step === 2 && (
            <div className="fade-in">
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🔧 Work Category & Known Skills
                </h4>
                <div className="form-group">
                  <label className="form-label">Primary Trade Category *</label>
                  <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)} required>
                    <option value="">Select primary trade</option>
                    {WORKER_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">What are the work they know? (Skills)</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="e.g. Wiring, Switchboard Repair, Fan Installation"
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                    />
                    <button type="button" className="btn btn-secondary" onClick={addSkill}>Add Skill</button>
                  </div>
                  <div className="skill-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {form.skills.map((s, i) => (
                      <span key={i} className="skill-tag" style={{ background: '#e0e7ff', color: '#3730a3', padding: '3px 8px', borderRadius: 6, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {s}
                        <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeSkill(i)} />
                      </span>
                    ))}
                    {form.skills.length === 0 && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No individual skills added yet. Type above and click Add.</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border, #e2e8f0)', paddingTop: 16 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CreditCard size={16} color="var(--primary)" /> Bank Account Details (For Payouts)
                </h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Bank Account Number *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. 50100234567890"
                      value={form.bankAccountNo}
                      onChange={e => set('bankAccountNo', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">IFSC Code *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. HDFC0001234"
                      value={form.bankIfsc}
                      onChange={e => set('bankIfsc', e.target.value.toUpperCase())}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Bank Name & Branch *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. HDFC Bank, Anna Nagar Branch"
                    value={form.bankName}
                    onChange={e => set('bankName', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Verification Pathway */}
          {step === 3 && (
            <div className="fade-in">
              <div style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: 14 }}>Select Verification Pathway *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                  <div
                    onClick={() => set('kycMethod', 'certificate')}
                    style={{
                      border: form.kycMethod === 'certificate' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: form.kycMethod === 'certificate' ? '#eff6ff' : '#fff',
                      borderRadius: 10,
                      padding: 14,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 4 }}>🏛️</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: form.kycMethod === 'certificate' ? '#1d4ed8' : '#334155' }}>Government Certified</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                      ITI / NSDC / PMKVY skill certificate holder.
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                      ⚡ Instant KYC Completed & Activated
                    </div>
                  </div>

                  <div
                    onClick={() => set('kycMethod', 'community_voucher')}
                    style={{
                      border: form.kycMethod === 'community_voucher' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: form.kycMethod === 'community_voucher' ? '#eff6ff' : '#fff',
                      borderRadius: 10,
                      padding: 14,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 4 }}>👥</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: form.kycMethod === 'community_voucher' ? '#1d4ed8' : '#334155' }}>Client References</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                      Past client references with phone & current address.
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: '#d97706', fontWeight: 600 }}>
                      📋 Reference verification required
                    </div>
                  </div>
                </div>
              </div>

              {/* Government Certificate Section */}
              {form.kycMethod === 'certificate' ? (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15803d', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                    <CheckCircle2 size={18} /> Government Certified Pathway
                  </div>
                  <p style={{ fontSize: 12, color: '#166534', margin: '0 0 12px' }}>
                    Upon saving, this worker's KYC status will automatically be marked <strong>Completed & Successful</strong>.
                  </p>

                  <div className="form-group">
                    <label className="form-label" style={{ color: '#166534' }}>Certificate ID / Registration No. *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. ITI-TN-2023-4412 or PMKVY-ELEC-9021"
                      value={form.certId}
                      onChange={e => set('certId', e.target.value)}
                      required
                    />
                  </div>
                </div>
              ) : (
                /* Client Reference Section */
                <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b21a8', fontWeight: 600, fontSize: 13 }}>
                      <Building size={16} /> Past Client References (Current Address & 10-Digit Phone)
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addClientRefRow} style={{ fontSize: 11 }}>
                      + Add Reference
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: '#7e22ce', margin: '0 0 12px' }}>
                    Enter past client details including their name, 10-digit phone number, and current address.
                  </p>

                  {form.clientRefs.map((ref, idx) => (
                    <div key={idx} style={{ background: '#fff', border: '1px solid #d8b4fe', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#6b21a8' }}>Client Reference #{idx + 1}</span>
                        {form.clientRefs.length > 1 && (
                          <button type="button" onClick={() => removeClientRefRow(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 11 }}>
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="form-grid" style={{ marginBottom: 8 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: 11 }}>Client Full Name *</label>
                          <input
                            className="form-input"
                            placeholder="e.g. Anand Sundaram"
                            value={ref.refName}
                            onChange={e => setClientRef(idx, 'refName', e.target.value)}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: 11 }}>Client Phone * (10 Digits)</label>
                          <input
                            className="form-input"
                            type="tel"
                            maxLength={10}
                            placeholder="e.g. 9444123456"
                            value={ref.refPhone}
                            onChange={e => setClientRef(idx, 'refPhone', e.target.value.replace(/\D/g, ''))}
                          />
                        </div>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: 11 }}>Client Current Address *</label>
                        <input
                          className="form-input"
                          placeholder="e.g. Flat 3A, Green Meadows, Anna Nagar, Chennai"
                          value={ref.refAddress}
                          onChange={e => setClientRef(idx, 'refAddress', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--border, #e2e8f0)' }}>
          {step > 1 ? (
            <button className="btn btn-secondary" onClick={() => { setValidationError(''); setStep(s => s - 1); }}>
              ← Back
            </button>
          ) : <div />}

          {step === 1 && (
            <button className="btn btn-primary" onClick={() => { if (validateStep1()) setStep(2); }}>
              Next: Work & Bank Details →
            </button>
          )}

          {step === 2 && (
            <button className="btn btn-primary" onClick={() => { if (validateStep2()) setStep(3); }}>
              Next: KYC Pathway →
            </button>
          )}

          {step === 3 && (
            <button className="btn btn-primary" onClick={handleFinalSubmit} disabled={loading} style={{ background: '#16a34a' }}>
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Loader size={16} className="spinner" /> Saving to Supabase...
                </span>
              ) : (
                'Save Worker & Complete Registration'
              )}
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
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedWorker, setSelectedWorker] = useState(null);

  const filtered = workers.filter(w => {
    const matchesSearch =
      w.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.phone?.includes(searchTerm) ||
      w.uniqueId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = filterCat === 'all' || w.category === filterCat;
    const matchesStatus = filterStatus === 'all' || w.kycStatus === filterStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleRegister = async (data) => {
    const worker = await registerWorker(data);
    const msg = worker.kycStatus === 'active'
      ? `Worker registered successfully!\n\nName: ${worker.name}\nWorker ID: ${worker.uniqueId}\nDefault Password: ${worker.defaultPassword}\nKYC Status: COMPLETED (Gov Certified)\n\nAll details saved in Supabase database.`
      : `Worker registered successfully!\n\nName: ${worker.name}\nWorker ID: ${worker.uniqueId}\nDefault Password: ${worker.defaultPassword}\nKYC Status: Verifying Client References\n\nAll details saved in Supabase database.`;
    alert(msg);
  };

  const handleApprove = async () => {
    if (!selectedWorker) return;
    await approveKyc(selectedWorker.id);
    alert('Worker KYC approved and activated successfully.');
    setSelectedWorker(null);
  };

  const handleReject = async () => {
    if (!selectedWorker) return;
    if (!window.confirm('Are you sure you want to reject this worker KYC?')) return;
    await rejectKyc(selectedWorker.id, { reason: 'Client reference verification failed' });
    alert('Worker KYC marked as rejected.');
    setSelectedWorker(null);
  };

  return (
    <div className="page-body fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Workers Directory</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
            Manage registered community workers, live photo profiles, bank details & KYC status
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Register New Worker
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar" style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-box" style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search by name, 10-digit phone, worker ID or address..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="form-select" style={{ width: 180 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="all">All Categories</option>
          {WORKER_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
        </select>
        <select className="form-select" style={{ width: 170 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All KYC Statuses</option>
          <option value="active">Completed (Active)</option>
          <option value="verifying">Verifying Client Refs</option>
          <option value="pending">Pending KYC</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Workers Table */}
      <div className="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Photo</th>
              <th>Worker & Contact</th>
              <th>Age & Address</th>
              <th>Category & Skills</th>
              <th>Bank Account</th>
              <th>KYC Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(w => {
              const cat = getCategoryInfo(w.category);
              const skillsList = Array.isArray(w.skills) ? w.skills : [];
              return (
                <tr key={w.id}>
                  {/* Photo */}
                  <td style={{ width: 56 }}>
                    {w.photoUrl ? (
                      <img
                        src={w.photoUrl}
                        alt={w.name}
                        style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }}
                      />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                        {w.name?.charAt(0) || 'W'}
                      </div>
                    )}
                  </td>

                  {/* Worker & Contact */}
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{w.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>{w.uniqueId}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={11} /> {w.phone}
                    </div>
                  </td>

                  {/* Age & Address */}
                  <td>
                    {w.age ? <div style={{ fontSize: 12, fontWeight: 600 }}>{w.age} yrs</div> : null}
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <MapPin size={11} style={{ display: 'inline', marginRight: 2 }} />
                      {w.address || w.city || 'Address on file'}
                    </div>
                  </td>

                  {/* Category & Skills */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: 13 }}>
                      <span>{cat.emoji}</span> {cat.label}
                    </div>
                    {skillsList.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {skillsList.slice(0, 2).map((s, i) => (
                          <span key={i} style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: 4 }}>
                            {s}
                          </span>
                        ))}
                        {skillsList.length > 2 && (
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{skillsList.length - 2} more</span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Bank Account */}
                  <td>
                    {w.bankAccountNo ? (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CreditCard size={12} color="#16a34a" /> •••• {w.bankAccountNo.slice(-4)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.bankIfsc}</div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Not provided</span>
                    )}
                  </td>

                  {/* KYC Status */}
                  <td>
                    <KycBadge status={w.kycStatus} method={w.kycMethod} />
                  </td>

                  {/* Actions */}
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedWorker(w)}
                      style={{ fontSize: 12 }}
                    >
                      View / KYC
                    </button>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No workers found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && <RegisterWorkerModal onClose={() => setShowModal(false)} onSubmit={handleRegister} />}

      {/* Selected Worker Review Modal */}
      {selectedWorker && (
        <div className="modal-overlay" onClick={() => setSelectedWorker(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div className="modal-title">Worker Profile & KYC Review</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedWorker(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {/* Header profile card */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 16, background: 'var(--bg-secondary, #f8fafc)', borderRadius: 12, marginBottom: 16 }}>
                {selectedWorker.photoUrl ? (
                  <img
                    src={selectedWorker.photoUrl}
                    alt={selectedWorker.name}
                    style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', border: '2px solid #2563eb' }}
                  />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: 12, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24 }}>
                    {selectedWorker.name?.charAt(0) || 'W'}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedWorker.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>{selectedWorker.uniqueId}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>📞 {selectedWorker.phone}</span>
                    {selectedWorker.age ? <span>🎂 {selectedWorker.age} years old</span> : null}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <KycBadge status={selectedWorker.kycStatus} method={selectedWorker.kycMethod} />
                  </div>
                </div>
              </div>

              {/* Address & Skills */}
              <div className="form-grid" style={{ marginBottom: 16 }}>
                <div className="card" style={{ padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Current Address
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    {selectedWorker.address || selectedWorker.city || 'No address provided'}
                  </div>
                </div>
                <div className="card" style={{ padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Trade & Skills Known
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    {getCategoryInfo(selectedWorker.category).emoji} {getCategoryInfo(selectedWorker.category).label}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(Array.isArray(selectedWorker.skills) ? selectedWorker.skills : []).map((s, i) => (
                      <span key={i} style={{ fontSize: 11, background: '#eff6ff', color: '#1e40af', padding: '1px 6px', borderRadius: 4 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="card" style={{ padding: 14, marginBottom: 16, background: '#f8fafc' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CreditCard size={15} color="#16a34a" /> Bank Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Account No:</span> <br/>
                    <strong>{selectedWorker.bankAccountNo || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>IFSC:</span> <br/>
                    <strong>{selectedWorker.bankIfsc || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Bank & Branch:</span> <br/>
                    <strong>{selectedWorker.bankName || '—'}</strong>
                  </div>
                </div>
              </div>

              {/* Verification Section */}
              {selectedWorker.kycMethod === 'certificate' ? (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#15803d', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                    <CheckCircle2 size={16} /> Government Certified Worker
                  </div>
                  <div style={{ fontSize: 12, color: '#166534' }}>
                    Certificate ID: <strong>{selectedWorker.certId || 'Registered & Verified'}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>
                    Status: <span style={{ color: '#15803d', fontWeight: 700 }}>KYC Completed & Active</span>
                  </div>
                </div>
              ) : (
                /* Client References */
                <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b21a8', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                    <Building size={16} /> Client References on File
                  </div>
                  {Array.isArray(selectedWorker.kycRefs) && selectedWorker.kycRefs.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selectedWorker.kycRefs.map((ref, idx) => (
                        <div key={idx} style={{ background: '#fff', border: '1px solid #d8b4fe', borderRadius: 8, padding: 10, fontSize: 12 }}>
                          <div><strong>Name:</strong> {ref.ref_name || 'Client Reference'}</div>
                          <div><strong>Phone:</strong> 📞 {ref.ref_phone}</div>
                          <div><strong>Current Address:</strong> 📍 {ref.ref_address || 'Address recorded'}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      No client references found.
                    </div>
                  )}

                  {selectedWorker.kycStatus !== 'active' && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                      <button className="btn btn-success btn-sm" onClick={handleApprove} style={{ background: '#16a34a' }}>
                        ✓ Approve References & Activate Worker
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={handleReject}>
                        ✕ Reject KYC
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedWorker(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkersPage;
