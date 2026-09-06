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
  const load = useCallback(() => federationApi.listSocieties().then(setRows).catch((err) => setError(readFederationError(err, 'Could not load societies.'))), []);
  useEffect(() => { load(); }, [load]);
  const filtered = rows.filter((item) => `${item.name} ${item.societyCode} ${item.city || ''}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="authority-page"><div className="authority-eyebrow">Directory</div><h1>Societies</h1><p className="authority-lead">Review every cooperative connected to the federation.</p><section className="authority-panel"><div className="authority-toolbar"><div className="authority-search"><Search size={17} /><input placeholder="Search name, code or city" value={query} onChange={(event) => setQuery(event.target.value)} /></div><button className="authority-refresh" onClick={load}>Refresh</button></div>{error && <div className="authority-error">{error}</div>}<div className="authority-table-wrap"><table className="authority-table"><thead><tr><th>Society</th><th>Registration code</th><th>Location</th><th>Status</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td className="authority-mono">{item.societyCode || '--'}</td><td>{item.city || '--'}</td><td><span className={`authority-badge ${item.isActive ? 'is-active' : ''}`}>{item.isActive ? 'Active' : 'Inactive'}</span></td></tr>)}</tbody></table>{!filtered.length && <div className="authority-empty">No societies match this search.</div>}</div></section></div>;
}

function Workers() {
  const [rows, setRows] = useState([]); const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null); const [reason, setReason] = useState('');
  useEffect(() => { federationApi.listWorkers().then(setRows).catch(() => setRows([])); }, []);
  const filtered = rows.filter((item) => `${item.name} ${item.uniqueId} ${item.societyName || ''}`.toLowerCase().includes(query.toLowerCase()));
  const refresh = () => federationApi.listWorkers().then(setRows).catch(() => setRows([]));
  const verify = () => federationApi.verifyWorker(selected.id).then(() => { setSelected(null); refresh(); });
  const reject = () => federationApi.rejectWorker(selected.id, reason || 'Certificate could not be verified').then(() => { setSelected(null); setReason(''); refresh(); });
  return <div className="authority-page"><div className="authority-eyebrow">Verification queue</div><h1>Workforce</h1><p className="authority-lead">Workers submitted by societies appear here for authority verification.</p><section className="authority-panel"><div className="authority-toolbar"><div className="authority-search"><Search size={17} /><input placeholder="Search worker or society" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div><div className="authority-table-wrap"><table className="authority-table"><thead><tr><th>Worker</th><th>Society</th><th>Certificate</th><th>Verification</th><th>Actions</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><small>{item.uniqueId}</small></td><td>{item.societyName || '--'}</td><td><strong>{item.certificateId || 'Not submitted'}</strong><small>{item.certificateAuthority || 'Certificate authority unavailable'}</small></td><td><span className={`authority-badge ${item.authorityStatus === 'verified' ? 'is-active' : ''}`}>{item.authorityStatus || 'pending'}</span></td><td className="authority-actions"><button className="authority-refresh" onClick={() => setSelected(item)}>Review</button></td></tr>)}</tbody></table>{!filtered.length && <div className="authority-empty">No workers found.</div>}</div></section>{selected && <div className="authority-modal-backdrop" onClick={() => setSelected(null)}><div className="authority-modal" onClick={(event) => event.stopPropagation()}><div className="authority-modal__header"><div><span className="authority-eyebrow">Certificate review</span><h2>{selected.name}</h2></div><button onClick={() => setSelected(null)}>×</button></div><dl className="authority-review-grid"><div><dt>Worker ID</dt><dd>{selected.uniqueId}</dd></div><div><dt>Society</dt><dd>{selected.societyName}</dd></div><div><dt>Certificate ID</dt><dd>{selected.certificateId || 'Not submitted'}</dd></div><div><dt>Issuing authority</dt><dd>{selected.certificateAuthority || '--'}</dd></div><div><dt>Expiry</dt><dd>{selected.certificateExpiry || '--'}</dd></div><div><dt>Society KYC</dt><dd>{selected.kycStatus || 'pending'}</dd></div></dl><label className="authority-field"><span>Decision note</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required for rejection or additional review notes" /></label><div className="authority-modal__actions"><button className="authority-refresh" onClick={() => setSelected(null)}>Cancel</button><button className="authority-refresh authority-danger" onClick={reject}>Reject certificate</button><button className="authority-refresh authority-approve" onClick={verify}>Verify certificate</button></div></div></div>}</div>;
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

function AggregateModule({ title, icon: Icon, load, fields }) {
  const [data, setData] = useState(null); const [error, setError] = useState('');
  useEffect(() => { load().then(setData).catch((err) => setError(readFederationError(err, `Could not load ${title.toLowerCase()}.`))); }, [load, title]);
  return <div className="authority-page"><div className="authority-eyebrow">Authority intelligence</div><h1>{title}</h1><p className="authority-lead">Aggregated directly from marketplace records.</p>{error ? <div className="authority-error">{error}</div> : !data ? <div className="authority-empty">Loading...</div> : <div className="authority-stats">{fields.map(([key, label]) => <StatCard key={key} label={label} value={Array.isArray(data[key]) ? data[key].length : data[key] ?? 0} icon={Icon} accent="blue" />)}</div>}</div>;
}

export default function FederationDashboardPage() {
  const { user, signOut } = useFederationAuth(); const location = useLocation(); const [menuOpen, setMenuOpen] = useState(false);
  const active = nav.find((item) => location.pathname === item.path) || nav.find((item) => location.pathname.startsWith(`${item.path}/`)) || nav[0];
  return <div className="authority-layout"><aside className={`authority-sidebar ${menuOpen ? 'is-open' : ''}`}><div className="authority-brand"><span className="authority-brand__mark"><ShieldCheck size={21} /></span><div><strong>Coop<span>Ledger</span></strong><small>Federation authority</small></div></div><div className="authority-context"><span>GOVERNANCE NETWORK</span><strong>National cooperative service layer</strong></div><nav><span className="authority-nav-label">Workspace</span>{nav.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path} end={path === '/federation/dashboard'} onClick={() => setMenuOpen(false)} className={({ isActive }) => `authority-nav-item ${isActive ? 'active' : ''}`}><Icon size={18} />{label}</NavLink>)}</nav><div className="authority-sidebar__bottom"><NavLink to="/federation/settings" className="authority-nav-item"><Settings2 size={18} />Settings</NavLink><button className="authority-nav-item authority-signout" onClick={signOut}><LogOut size={18} />Sign out</button></div></aside><main className="authority-main"><header className="authority-topbar"><button className="authority-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation"><Menu size={21} /></button><div><span className="authority-topbar__label">{active.label}</span><span className="authority-topbar__path">/ federation / {active.label.toLowerCase()}</span></div><div className="authority-user"><span>{user?.name?.charAt(0).toUpperCase() || 'F'}</span><div><strong>{user?.name}</strong><small>{user?.email}</small></div></div></header><Routes><Route index element={<Navigate to="/federation/dashboard" replace />} /><Route path="dashboard" element={<Overview />} /><Route path="societies" element={<Societies />} /><Route path="workers" element={<Workers />} /><Route path="compliance" element={<DataModule title="Compliance documents" icon={FileCheck2} load={federationApi.listDocuments} columns={[["name","Document"],["category","Category"],["status","Status"],["expiresAt","Expiry"]]} actions={(row, refresh) => <button className="authority-refresh" onClick={() => federationApi.updateDocumentStatus(row.id, { status: row.status === 'verified' ? 'pending' : 'verified' }).then(refresh)}>Toggle status</button>} />} /><Route path="bookings" element={<DataModule title="Booking monitoring" icon={ClipboardCheck} load={federationApi.listBookings} columns={[["id","ID"],["customer","Customer"],["society","Society"],["service","Service"],["status","Status"],["amount","Amount"]]} />} /><Route path="complaints" element={<DataModule title="Complaints & grievances" icon={AlertTriangle} load={federationApi.listComplaints} columns={[["id","ID"],["title","Complaint"],["status","Status"],["raisedAt","Raised"]]} actions={(row, refresh) => <button className="authority-refresh" onClick={() => federationApi.updateComplaintStatus(row.id, { status: row.status === 'closed' ? 'open' : 'closed' }).then(refresh)}>Close / reopen</button>} />} /><Route path="analytics" element={<AggregateModule title="Geo & insights" icon={Map} load={federationApi.getAnalytics} fields={[["skills","Skill groups"],["services","Service groups"],["locations","Locations"]]} />} /><Route path="financials" element={<AggregateModule title="Financial analytics" icon={BarChart3} load={federationApi.getFinancials} fields={[["transactionValue","Transaction value"],["completedTransactions","Completed transactions"],["pendingPayments","Pending payments"]]} />} /><Route path="welfare" element={<AggregateModule title="Welfare monitoring" icon={ShieldCheck} load={federationApi.getWelfare} fields={[["totalWorkers","Workers"],["covered","Covered"],["notCovered","Not covered"]]} />} /><Route path="quality" element={<AggregateModule title="Quality & ratings" icon={Activity} load={federationApi.getQuality} fields={[["averageRating","Average rating"],["completedBookings","Completed"],["cancelledBookings","Cancelled"],["openComplaints","Open complaints"]]} />} /><Route path="inspections" element={<DataModule title="Inspections" icon={ClipboardCheck} load={federationApi.listInspections} columns={[["id","ID"],["societyId","Society"],["type","Type"],["purpose","Purpose"],["result","Result"]]} />} /><Route path="audit-logs" element={<DataModule title="Audit logs" icon={FileCheck2} load={federationApi.listAuditLogs} columns={[["action","Action"],["module","Module"],["entityType","Entity"],["reason","Reason"],["createdAt","Created"]]} />} /><Route path="settings" element={<Placeholder title="Authority settings" icon={Settings2} />} /><Route path="*" element={<Navigate to="/federation/dashboard" replace />} /></Routes></main></div>;
}
