import { useCallback, useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import {
  Activity, AlertTriangle, BarChart3, Building2, ClipboardCheck, FileCheck2,
  LayoutDashboard, LogOut, Map, Menu, Search, Settings2, ShieldCheck, Users,
} from 'lucide-react';
import { useFederationAuth } from '../context/FederationAuthContext.jsx';
import { federationApi, readFederationError } from '../api/federationApi.js';
import '../styles/federation.css';

const nav = [
  { path: '/federation/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/federation/societies', label: 'Societies', icon: Building2 },
  { path: '/federation/workers', label: 'Workforce', icon: Users },
  { path: '/federation/compliance', label: 'Compliance', icon: FileCheck2 },
  { path: '/federation/bookings', label: 'Bookings', icon: ClipboardCheck },
  { path: '/federation/complaints', label: 'Complaints', icon: AlertTriangle },
  { path: '/federation/analytics', label: 'Geo & insights', icon: Map },
  { path: '/federation/financials', label: 'Financials', icon: BarChart3 },
  { path: '/federation/welfare', label: 'Welfare', icon: ShieldCheck },
  { path: '/federation/quality', label: 'Quality', icon: Activity },
  { path: '/federation/inspections', label: 'Inspections', icon: ClipboardCheck },
  { path: '/federation/audit-logs', label: 'Audit logs', icon: FileCheck2 },
];

function StatCard({ label, value, icon: Icon, accent }) {
  return <div className="authority-stat"><div className={`authority-stat__icon ${accent}`}><Icon size={19} /></div><div><strong>{value}</strong><span>{label}</span></div></div>;
}

function Overview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { federationApi.dashboard().then(setStats).catch((err) => setError(readFederationError(err, 'Could not load authority metrics.'))); }, []);
  if (error) return <div className="authority-error">{error}</div>;
  if (!stats) return <div className="authority-empty">Loading authority metrics...</div>;
  const cards = [
    ['Total societies', stats.totalSocieties, Building2, 'blue'], ['Active societies', stats.activeSocieties, ShieldCheck, 'green'],
    ['Pending approvals', stats.pendingApprovals, ClipboardCheck, 'amber'], ['Total workers', stats.totalWorkers, Users, 'violet'],
    ['Verified workers', stats.verifiedWorkers, FileCheck2, 'green'], ['Total bookings', stats.totalBookings, Activity, 'blue'],
    ['Transaction value', `₹${Number(stats.transactionValue || 0).toLocaleString()}`, BarChart3, 'teal'], ['Open complaints', stats.openComplaints, AlertTriangle, 'red'],
  ];
  return <div className="authority-page"><div className="authority-eyebrow">Governance pulse</div><h1>Cooperative ecosystem</h1><p className="authority-lead">A clear view of societies, verified workforce, marketplace activity and risk signals.</p><div className="authority-stats">{cards.map(([label, value, icon, accent]) => <StatCard key={label} label={label} value={value} icon={icon} accent={accent} />)}</div><section className="authority-panel authority-panel--signal"><div><span className="authority-panel__eyebrow">Operating principle</span><h2>Society-led operations, authority-led trust.</h2><p>Societies manage their workers and daily dispatch. The authority verifies, monitors and acts on evidence across the network.</p></div><ShieldCheck size={42} /></section></div>;
}

function Societies() {
  const [rows, setRows] = useState([]); const [query, setQuery] = useState(''); const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ name: '', societyCode: '', city: '', password: '', registrationNumber: '', registrationDate: '', registrationExpiry: '', email: '', phone: '', address: '', status: 'active', isActive: true });
  const [submitting, setSubmitting] = useState(false);
  
  const load = useCallback(() => federationApi.listSocieties().then(setRows).catch((err) => setError(readFederationError(err, 'Could not load societies.'))), []);
  useEffect(() => { load(); }, [load]);
  
  const filtered = rows.filter((item) => `${item.name} ${item.societyCode} ${item.city || ''}`.toLowerCase().includes(query.toLowerCase()));
  
  const handleStatusChange = async (id, status, reason) => {
    try {
      await federationApi.updateSocietyStatus(id, { status, reason });
      load();
    } catch (err) {
      setError(readFederationError(err, 'Failed to update society status.'));
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await federationApi.createSociety(formData);
      setShowAdd(false);
      setFormData({ name: '', societyCode: '', city: '', password: '', registrationNumber: '', registrationDate: '', registrationExpiry: '', email: '', phone: '', address: '', status: 'active', isActive: true });
      load();
    } catch (err) {
      setError(readFederationError(err, 'Failed to create society.'));
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="authority-page"><div className="authority-eyebrow">Directory</div><h1>Societies</h1><p className="authority-lead">Review every cooperative connected to the federation.</p><section className="authority-panel"><div className="authority-toolbar"><div className="authority-search"><Search size={17} /><input placeholder="Search name, code or city" value={query} onChange={(event) => setQuery(event.target.value)} /></div><button className="authority-refresh" onClick={() => setShowAdd(true)}>Add Society</button><button className="authority-refresh" onClick={load}>Refresh</button></div>{error && <div className="authority-error">{error}</div>}<div className="authority-table-wrap"><table className="authority-table"><thead><tr><th>Society</th><th>Registration code</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td className="authority-mono">{item.societyCode || '--'}</td><td>{item.city || '--'}</td><td><span className={`authority-badge ${item.isActive ? 'is-active' : ''}`}>{item.isActive ? 'Active' : (item.status === 'submitted' ? 'Pending Approval' : 'Inactive')}</span></td><td className="authority-actions">{item.isActive ? <button className="authority-refresh authority-danger" onClick={() => handleStatusChange(item.id, 'suspended', 'Suspended by federation')}>Deactivate</button> : <button className="authority-refresh authority-approve" onClick={() => handleStatusChange(item.id, 'active', 'Approved and activated by federation')}>Approve & Activate</button>}</td></tr>)}</tbody></table>{!filtered.length && <div className="authority-empty">No societies match this search.</div>}</div></section>
  {showAdd && <div className="authority-modal-backdrop" onClick={() => setShowAdd(false)}><div className="authority-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}><div className="authority-modal__header"><div><span className="authority-eyebrow">Onboarding</span><h2>Add New Society</h2></div><button onClick={() => setShowAdd(false)}>×</button></div><form onSubmit={handleAdd}><div className="authority-review-grid" style={{ marginBottom: '20px' }}><div><label className="authority-field"><span>Society Name*</span><input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></label></div><div><label className="authority-field"><span>Society Code*</span><input required value={formData.societyCode} onChange={e => setFormData({...formData, societyCode: e.target.value})} /></label></div><div><label className="authority-field"><span>City/Region*</span><input required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></label></div><div><label className="authority-field"><span>Admin Password*</span><input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></label></div><div><label className="authority-field"><span>Registration Number</span><input value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} /></label></div><div><label className="authority-field"><span>Registration Date</span><input type="date" value={formData.registrationDate} onChange={e => setFormData({...formData, registrationDate: e.target.value})} /></label></div><div><label className="authority-field"><span>Registration Expiry</span><input type="date" value={formData.registrationExpiry} onChange={e => setFormData({...formData, registrationExpiry: e.target.value})} /></label></div><div><label className="authority-field"><span>Email Address</span><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></label></div><div><label className="authority-field"><span>Phone Number</span><input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></label></div><div><label className="authority-field"><span>Full Address</span><input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></label></div></div><div className="authority-modal__actions"><button type="button" className="authority-refresh" onClick={() => setShowAdd(false)}>Cancel</button><button type="submit" className="authority-refresh authority-approve" disabled={submitting}>{submitting ? 'Creating...' : 'Create Society'}</button></div></form></div></div>}</div>;
}

function Workers() {
  const [rows, setRows] = useState([]); const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null); const [reason, setReason] = useState('');
  useEffect(() => { federationApi.listWorkers().then(setRows).catch(() => setRows([])); }, []);
  const filtered = rows.filter((item) => `${item.name} ${item.uniqueId} ${item.societyName || ''}`.toLowerCase().includes(query.toLowerCase()));
  const refresh = () => federationApi.listWorkers().then(setRows).catch(() => setRows([]));
  const verify = () => federationApi.verifyWorker(selected.id).then(() => { setSelected(null); refresh(); });
  const reject = () => federationApi.rejectWorker(selected.id, reason || 'Certificate could not be verified').then(() => { setSelected(null); setReason(''); refresh(); });
  return <div className="authority-page"><div className="authority-eyebrow">Verification queue</div><h1>Workforce</h1><p className="authority-lead">Workers submitted by societies appear here for authority verification.</p><section className="authority-panel"><div className="authority-toolbar"><div className="authority-search"><Search size={17} /><input placeholder="Search worker or society" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div><div className="authority-table-wrap"><table className="authority-table"><thead><tr><th>Worker</th><th>Region / Society</th><th>Certificate</th><th>Verification</th><th>Actions</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><small>{item.uniqueId}</small></td><td><strong>{item.city || '--'}</strong><small>{item.societyName || '--'}</small></td><td><strong>{item.certificateId || 'Not submitted'}</strong><small>{item.certificateAuthority || 'Certificate authority unavailable'}</small></td><td><span className={`authority-badge ${item.authorityStatus === 'verified' ? 'is-active' : ''}`}>{item.authorityStatus || 'pending'}</span></td><td className="authority-actions"><button className="authority-refresh" onClick={() => setSelected(item)}>Review</button></td></tr>)}</tbody></table>{!filtered.length && <div className="authority-empty">No workers found.</div>}</div></section>{selected && <div className="authority-modal-backdrop" onClick={() => setSelected(null)}><div className="authority-modal" onClick={(event) => event.stopPropagation()}><div className="authority-modal__header"><div><span className="authority-eyebrow">Certificate review</span><h2>{selected.name}</h2></div><button onClick={() => setSelected(null)}>×</button></div><dl className="authority-review-grid"><div><dt>Worker ID</dt><dd>{selected.uniqueId}</dd></div><div><dt>Society</dt><dd>{selected.societyName} ({selected.societyCode})</dd></div><div><dt>Region / City</dt><dd>{selected.city || '--'}</dd></div><div><dt>Skills / Category</dt><dd>{selected.category || '--'} {selected.skills?.length ? `(${selected.skills.join(', ')})` : ''}</dd></div><div><dt>Rating</dt><dd>{selected.rating > 0 ? `⭐ ${selected.rating.toFixed(1)}` : 'No ratings'}</dd></div><div><dt>Jobs Completed</dt><dd>{selected.completedJobs || 0}</dd></div><div><dt>Certificate ID</dt><dd>{selected.certificateId || 'Not submitted'}</dd></div><div><dt>Issuing authority</dt><dd>{selected.certificateAuthority || '--'}</dd></div><div><dt>Expiry</dt><dd>{selected.certificateExpiry || '--'}</dd></div><div><dt>Society KYC</dt><dd>{selected.kycStatus || 'pending'}</dd></div></dl><label className="authority-field"><span>Decision note</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required for rejection or additional review notes" /></label><div className="authority-modal__actions"><button className="authority-refresh" onClick={() => setSelected(null)}>Cancel</button><button className="authority-refresh authority-danger" onClick={reject}>Reject certificate</button><button className="authority-refresh authority-approve" onClick={verify}>Verify certificate</button></div></div></div>}</div>;
}

function DataModule({ title, icon: Icon, load, columns, actions }) {
  const [rows, setRows] = useState([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const refresh = useCallback(() => { setLoading(true); load().then(setRows).catch((err) => setError(readFederationError(err, `Could not load ${title.toLowerCase()}.`))).finally(() => setLoading(false)); }, [load, title]);
  useEffect(() => { refresh(); }, [refresh]);
  return <div className="authority-page"><div className="authority-eyebrow">Governance module</div><h1>{title}</h1><p className="authority-lead">Persistent authority records from the FastAPI governance layer.</p><section className="authority-panel"><div className="authority-toolbar"><button className="authority-refresh" onClick={refresh}>Refresh</button></div>{error && <div className="authority-error">{error}</div>}{loading ? <div className="authority-empty">Loading...</div> : <div className="authority-table-wrap"><table className="authority-table"><thead><tr>{columns.map(([key, label]) => <th key={key}>{label}</th>)}{actions && <th>Actions</th>}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{columns.map(([key]) => <td key={key}>{String(row[key] ?? '--')}</td>)}{actions && <td className="authority-actions">{actions(row, refresh)}</td>}</tr>)}</tbody></table>{!rows.length && <div className="authority-empty"><Icon size={28} />No records found.</div>}</div>}</section></div>;
}

function Placeholder({ title, icon: Icon }) {
  const loaders = {
    'Booking monitoring': () => federationApi.listBookings(),
    'Geo & insights': () => federationApi.getAnalytics(),
    'Financial analytics': () => federationApi.getFinancials(),
    'Welfare monitoring': () => federationApi.getWelfare(),
    'Quality & ratings': () => federationApi.getQuality(),
    'Inspections': () => federationApi.listInspections(),
    'Audit logs': () => federationApi.listAuditLogs(),
  };
  const [data, setData] = useState(null); const [error, setError] = useState('');
  useEffect(() => { loaders[title]?.().then(setData).catch((err) => setError(readFederationError(err, `Could not load ${title.toLowerCase()}.`))); }, [title]);
  if (error) return <div className="authority-page"><div className="authority-error">{error}</div></div>;
  return <div className="authority-page"><div className="authority-eyebrow">Governance module</div><h1>{title}</h1><p className="authority-lead">Live records from the FastAPI authority service.</p><section className="authority-panel authority-data-preview"><Icon size={30} /><strong>{data ? `${Array.isArray(data) ? data.length : Object.keys(data).length} data groups loaded` : 'Loading authority data...'}</strong><pre>{data ? JSON.stringify(data, null, 2) : ''}</pre></section></div>;
}

function WelfareModule() {
  const [data, setData] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); const [reason, setReason] = useState('');

  const refresh = useCallback(() => { setLoading(true); federationApi.getWelfare().then(setData).catch((err) => setError(readFederationError(err, 'Could not load welfare data.'))).finally(() => setLoading(false)); }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleReview = (id, status) => {
    federationApi.reviewWelfare(id, { status, reason }).then(() => { setSelected(null); setReason(''); refresh(); }).catch(err => alert(readFederationError(err)));
  };

  if (error) return <div className="authority-page"><div className="authority-error">{error}</div></div>;
  if (loading || !data) return <div className="authority-page"><div className="authority-empty">Loading...</div></div>;

  return <div className="authority-page"><div className="authority-eyebrow">Governance module</div><h1>Welfare & Benefits</h1><p className="authority-lead">Manage worker welfare scheme enrollments.</p><div className="authority-stats"><StatCard label="Total Workers" value={data.totalWorkers} icon={Users} accent="blue" /><StatCard label="Covered" value={data.covered} icon={ShieldCheck} accent="green" /><StatCard label="Not Covered" value={data.notCovered} icon={AlertTriangle} accent="amber" /></div><section className="authority-panel"><div className="authority-toolbar"><button className="authority-refresh" onClick={refresh}>Refresh List</button></div><div className="authority-table-wrap"><table className="authority-table"><thead><tr><th>Worker</th><th>Society</th><th>Scheme ID</th><th>Status</th><th>Actions</th></tr></thead><tbody>{data.enrollments.map((item) => <tr key={item.id}><td><strong>{item.workerName}</strong></td><td>{item.societyName}</td><td>{item.schemeId}</td><td><span className={`authority-badge ${item.status === 'approved' ? 'is-active' : ''}`}>{item.status}</span></td><td className="authority-actions"><button className="authority-refresh" onClick={() => setSelected(item)}>Review</button></td></tr>)}</tbody></table>{!data.enrollments.length && <div className="authority-empty">No enrollments found.</div>}</div></section>{selected && <div className="authority-modal-backdrop" onClick={() => setSelected(null)}><div className="authority-modal" onClick={(event) => event.stopPropagation()}><div className="authority-modal__header"><div><span className="authority-eyebrow">Enrollment review</span><h2>{selected.workerName}</h2></div><button onClick={() => setSelected(null)}>×</button></div><dl className="authority-review-grid"><div><dt>Worker</dt><dd>{selected.workerName}</dd></div><div><dt>Society</dt><dd>{selected.societyName}</dd></div><div><dt>Scheme ID</dt><dd>{selected.schemeId}</dd></div><div><dt>Current Status</dt><dd>{selected.status}</dd></div><div><dt>Documents Provided</dt><dd>{selected.data?.documents?.length ? selected.data.documents.join(', ') : 'None'}</dd></div><div><dt>Eligibility Notes</dt><dd>{JSON.stringify(selected.data?.eligibility || {})}</dd></div></dl><label className="authority-field"><span>Decision Note</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required for rejection or correction" /></label><div className="authority-modal__actions"><button className="authority-refresh" onClick={() => setSelected(null)}>Cancel</button><button className="authority-refresh authority-danger" onClick={() => handleReview(selected.id, 'rejected')}>Reject</button><button className="authority-refresh authority-approve" onClick={() => handleReview(selected.id, 'approved')}>Approve Enrollment</button></div></div></div>}</div>;
}

function QualityModule() {
  const [data, setData] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); federationApi.getQuality().then(setData).catch((err) => setError(readFederationError(err, 'Could not load quality data.'))).finally(() => setLoading(false)); }, []);
  if (error) return <div className="authority-page"><div className="authority-error">{error}</div></div>;
  if (loading || !data) return <div className="authority-page"><div className="authority-empty">Loading...</div></div>;

  return <div className="authority-page"><div className="authority-eyebrow">Governance module</div><h1>Quality & Ratings</h1><p className="authority-lead">Network-wide quality metrics.</p><div className="authority-stats"><StatCard label="Avg Rating" value={`⭐ ${data.averageRating}`} icon={Activity} accent="blue" /><StatCard label="Completed" value={data.completedBookings} icon={ClipboardCheck} accent="green" /><StatCard label="Cancelled" value={data.cancelledBookings} icon={AlertTriangle} accent="red" /><StatCard label="Open Complaints" value={data.openComplaints} icon={AlertTriangle} accent="amber" /></div><section className="authority-panel"><div className="authority-eyebrow">Per-Society Breakdown</div><div className="authority-table-wrap" style={{ marginTop: '1rem' }}><table className="authority-table"><thead><tr><th>Society</th><th>Avg Rating</th><th>Reviews</th><th>Completed</th><th>Cancelled</th><th>Complaints</th></tr></thead><tbody>{data.bySociety?.map((item) => <tr key={item.societyId}><td><strong>{item.societyName}</strong></td><td>⭐ {item.averageRating}</td><td>{item.ratingCount}</td><td>{item.completed}</td><td>{item.cancelled}</td><td>{item.complaints}</td></tr>)}</tbody></table>{(!data.bySociety || !data.bySociety.length) && <div className="authority-empty">No society data available.</div>}</div></section></div>;
}

function AggregateModule({ title, icon: Icon, load, fields }) {
  const [data, setData] = useState(null); const [error, setError] = useState('');
  useEffect(() => { load().then(setData).catch((err) => setError(readFederationError(err, `Could not load ${title.toLowerCase()}.`))); }, [load, title]);
  return <div className="authority-page"><div className="authority-eyebrow">Authority intelligence</div><h1>{title}</h1><p className="authority-lead">Aggregated directly from marketplace records.</p>{error ? <div className="authority-error">{error}</div> : !data ? <div className="authority-empty">Loading...</div> : <div className="authority-stats">{fields.map(([key, label]) => <StatCard key={key} label={label} value={Array.isArray(data[key]) ? data[key].length : data[key] ?? 0} icon={Icon} accent="blue" />)}</div>}</div>;
}

export default function FederationDashboardPage() {
  const { user, signOut } = useFederationAuth(); const location = useLocation(); const [menuOpen, setMenuOpen] = useState(false);
  const active = nav.find((item) => location.pathname === item.path) || nav.find((item) => location.pathname.startsWith(`${item.path}/`)) || nav[0];
  return <div className="authority-layout"><aside className={`authority-sidebar ${menuOpen ? 'is-open' : ''}`}><div className="authority-brand"><span className="authority-brand__mark"><ShieldCheck size={21} /></span><div><strong>Coop<span>Ledger</span></strong><small>Federation authority</small></div></div><div className="authority-context"><span>GOVERNANCE NETWORK</span><strong>National cooperative service layer</strong></div><nav><span className="authority-nav-label">Workspace</span>{nav.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path} end={path === '/federation/dashboard'} onClick={() => setMenuOpen(false)} className={({ isActive }) => `authority-nav-item ${isActive ? 'active' : ''}`}><Icon size={18} />{label}</NavLink>)}</nav><div className="authority-sidebar__bottom"><NavLink to="/federation/settings" className="authority-nav-item"><Settings2 size={18} />Settings</NavLink><button className="authority-nav-item authority-signout" onClick={signOut}><LogOut size={18} />Sign out</button></div></aside><main className="authority-main"><header className="authority-topbar"><button className="authority-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation"><Menu size={21} /></button><div><span className="authority-topbar__label">{active.label}</span><span className="authority-topbar__path">/ federation / {active.label.toLowerCase()}</span></div><div className="authority-user"><span>{user?.name?.charAt(0).toUpperCase() || 'F'}</span><div><strong>{user?.name}</strong><small>{user?.email}</small></div></div></header><Routes><Route index element={<Navigate to="/federation/dashboard" replace />} /><Route path="dashboard" element={<Overview />} /><Route path="societies" element={<Societies />} /><Route path="workers" element={<Workers />} /><Route path="compliance" element={<DataModule title="Compliance documents" icon={FileCheck2} load={federationApi.listDocuments} columns={[["name","Document"],["category","Category"],["status","Status"],["expiresAt","Expiry"]]} actions={(row, refresh) => <button className="authority-refresh" onClick={() => federationApi.updateDocumentStatus(row.id, { status: row.status === 'verified' ? 'pending' : 'verified' }).then(refresh)}>Toggle status</button>} />} /><Route path="bookings" element={<DataModule title="Booking monitoring" icon={ClipboardCheck} load={federationApi.listBookings} columns={[["id","ID"],["society","Society"],["service","Service"],["status","Status"],["requestedAt","Requested"]]} />} /><Route path="complaints" element={<DataModule title="Complaints & grievances" icon={AlertTriangle} load={federationApi.listComplaints} columns={[["id","ID"],["title","Complaint"],["status","Status"],["raisedAt","Raised"]]} actions={(row, refresh) => <button className="authority-refresh" onClick={() => federationApi.updateComplaintStatus(row.id, { status: row.status === 'closed' ? 'open' : 'closed' }).then(refresh)}>Close / reopen</button>} />} /><Route path="analytics" element={<AggregateModule title="Geo & insights" icon={Map} load={federationApi.getAnalytics} fields={[["skills","Skill groups"],["services","Service groups"],["locations","Locations"]]} />} /><Route path="financials" element={<AggregateModule title="Financial analytics" icon={BarChart3} load={federationApi.getFinancials} fields={[["transactionValue","Transaction value"],["completedTransactions","Completed transactions"],["pendingPayments","Pending payments"]]} />} /><Route path="welfare" element={<WelfareModule />} /><Route path="quality" element={<QualityModule />} /><Route path="inspections" element={<DataModule title="Inspections" icon={ClipboardCheck} load={federationApi.listInspections} columns={[["id","ID"],["societyId","Society"],["type","Type"],["purpose","Purpose"],["result","Result"]]} />} /><Route path="audit-logs" element={<DataModule title="Audit logs" icon={FileCheck2} load={federationApi.listAuditLogs} columns={[["action","Action"],["module","Module"],["entityType","Entity"],["reason","Reason"],["createdAt","Created"]]} />} /><Route path="settings" element={<Placeholder title="Authority settings" icon={Settings2} />} /><Route path="*" element={<Navigate to="/federation/dashboard" replace />} /></Routes></main></div>;
}
