import React from 'react';
import { useSociety } from '../context/SocietyContext';
import { WORKER_CATEGORIES, formatCurrency } from '../constants';
import { TrendingUp, Users, Briefcase, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const earningsData = [
  { day: 'Mon', amount: 18400 },
  { day: 'Tue', amount: 22100 },
  { day: 'Wed', amount: 19800 },
  { day: 'Thu', amount: 27500 },
  { day: 'Fri', amount: 31200 },
  { day: 'Sat', amount: 38900 },
  { day: 'Sun', amount: 24600 },
];

const DashboardPage = () => {
  const { workers, bookings, complaints, dashboard } = useSociety();

  const kycPending = workers.filter(w => w.kycStatus === 'pending' || w.kycStatus === 'inspection_required').length;
  const available = workers.filter(w => w.availability === 'available' && w.kycStatus === 'active').length;
  const onJob = workers.filter(w => w.availability === 'on_job' || w.availability === 'dispatched').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const openComplaints = complaints.filter(c => c.status === 'open' || c.status === 'under_review').length;

  // Category worker counts
  const categoryStats = WORKER_CATEGORIES.map(cat => ({
    ...cat,
    count: workers.filter(w => w.category === cat.id && w.kycStatus === 'active').length,
  }));

  const stats = [
    { label: 'Total Workers', value: workers.length, change: '+8 this month', up: true, icon: <Users size={20} />, color: '#2563EB', bg: '#DBEAFE' },
    { label: 'Available Now', value: available, change: `${onJob} on job`, up: true, icon: <CheckCircle size={20} />, color: '#10B981', bg: '#D1FAE5' },
    { label: "Today's Bookings", value: dashboard.todayBookings, change: `${pendingBookings} pending`, up: true, icon: <Briefcase size={20} />, color: '#F59E0B', bg: '#FEF3C7' },
    { label: "Today's Earnings", value: formatCurrency(dashboard.todayEarnings || 0), change: dashboard.todayEarnings > 0 ? 'Recorded today' : 'No jobs completed today', up: dashboard.todayEarnings > 0, icon: <TrendingUp size={20} />, color: '#8B5CF6', bg: '#EDE9FE' },
    { label: 'KYC Pending', value: kycPending, change: `${kycPending} need review`, up: false, icon: <Clock size={20} />, color: '#F97316', bg: '#FFEDD5' },
    { label: 'Open Complaints', value: openComplaints, change: openComplaints > 0 ? 'Needs resolution' : 'All resolved', up: openComplaints === 0, icon: <AlertTriangle size={20} />, color: '#EF4444', bg: '#FEE2E2' },
  ];

  const recentBookings = [...bookings].slice(0, 5);

  return (
    <div className="page-body fade-in">
      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className={`stat-change ${s.up ? 'up' : 'down'}`}>
                {s.up ? '▲' : '●'} {s.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
        {/* Earnings Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Weekly Earnings Overview</div>
              <div className="card-subtitle">{formatCurrency(dashboard.todayEarnings || 0)} earned today</div>
            </div>
            <span className="badge badge-success">Active Society</span>
          </div>
          <div className="card-body" style={{ paddingTop: 10 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v) => [formatCurrency(v), 'Earnings']}
                  contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 13 }}
                />
                <Bar dataKey="amount" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Worker Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Workers by Category</div>
              <div className="card-subtitle">Active certified workers only</div>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {categoryStats.map(cat => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 24, textAlign: 'center', fontSize: 16 }}>{cat.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{cat.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{cat.count}</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (cat.count / 30) * 100)}%`, background: cat.color, borderRadius: 99, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Bookings</div>
            <div className="card-subtitle">Latest service requests coming in</div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Type</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map(b => {
                const cat = WORKER_CATEGORIES.find(c => c.id === b.serviceCategory);
                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 12 }}>{b.id}</td>
                    <td>{b.customerName}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{cat?.emoji}</span> {cat?.label}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${b.type === 'bulk' ? 'badge-violet' : 'badge-sky'}`}>
                        {b.type === 'bulk' ? '👥 Bulk' : '👤 Single'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(b.estimatedAmount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    pending: ['badge-warning', 'Pending'],
    dispatched: ['badge-sky', 'Dispatched'],
    on_the_way: ['badge-primary', 'On the Way'],
    in_progress: ['badge-orange', 'In Progress'],
    completed: ['badge-success', 'Completed'],
    cancelled: ['badge-danger', 'Cancelled'],
  };
  const [cls, label] = map[status] || ['badge-muted', status];
  return <span className={`badge ${cls}`}>{label}</span>;
};

export default DashboardPage;
