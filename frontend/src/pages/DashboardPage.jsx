import { useSociety } from '../context/SocietyContext';
import { formatCurrency } from '../constants';
import { Briefcase, IndianRupee, Users, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import '../styles/dashboard.css';

/**
 * Society overview backed by the same data used by the society modules.
 */
export default function DashboardPage() {
  const { society, dashboard, workers, bookings, complaints, loading } = useSociety();
  const stats = [
    { label: 'Total workers', value: dashboard.totalWorkers ?? workers.length, icon: Users },
    { label: 'Total bookings', value: dashboard.totalBookings ?? bookings.length, icon: Briefcase },
    { label: 'Completed earnings', value: formatCurrency(dashboard.todayEarnings ?? 0), icon: IndianRupee },
    { label: 'Open complaints', value: complaints.filter((item) => !['resolved', 'escalated'].includes(item.status)).length, icon: AlertCircle },
  ];

  // Prepare data for the pie chart (Booking Statuses)
  const bookingStatusCounts = bookings.reduce((acc, booking) => {
    const status = booking.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  const pieData = Object.keys(bookingStatusCounts).map(status => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: bookingStatusCounts[status]
  }));
  const pieColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7'];

  // Prepare data for earnings bar chart
  const earningsData = (dashboard.weeklyEarnings || []).map(day => ({
    name: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    Earnings: day.amount
  }));

  return (
    <div className="page-body fade-in">
      <div className="page-header">
        <h2>{society?.name || 'Society'} dashboard</h2>
        <p>Operations overview for {society?.city || 'your cooperative community'}.</p>
      </div>
      {loading ? <div className="card">Loading society data...</div> : (
        <>
          <div className="stats-grid">
            {stats.map(({ label, value, icon: Icon }) => (
              <div className="stat-card" key={label}>
                <div className="stat-icon"><Icon size={20} /></div>
                <div className="stat-info"><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>
              </div>
            ))}
          </div>
          <div className="card operations-card">
            <div className="card-header">
              <div>
                <div className="card-title">Today&apos;s operations</div>
                <div className="card-subtitle">Live activity from your workers and customer bookings.</div>
              </div>
            </div>
            <div className="operations-grid">
              <div className="operation-item">
                <dt>Pending bookings</dt>
                <dd>{dashboard.pendingBookings ?? bookings.filter((item) => item.status === 'pending').length}</dd>
              </div>
              <div className="operation-item">
                <dt>Available workers</dt>
                <dd>{workers.filter((worker) => worker.availability === 'available').length}</dd>
              </div>
              <div className="operation-item">
                <dt>Society code</dt>
                <dd>{society?.societyCode || society?.code || '--'}</dd>
              </div>
            </div>
          </div>
          
          {/* Charts Section */}
          <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px', color: '#1f2937' }}>Booking Status Distribution</h3>
              {pieData.length > 0 ? (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} outerRadius={100} fill="#8884d8" dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="authority-empty" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No bookings available</div>
              )}
            </div>
            
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px', color: '#1f2937' }}>Earnings Past 7 Days</h3>
              {earningsData.length > 0 && earningsData.some(d => d.Earnings > 0) ? (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={earningsData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                      <YAxis tickFormatter={(val) => `₹${val}`} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <RechartsTooltip formatter={(value) => [`₹${value}`, 'Earnings']} cursor={{ fill: '#f3f4f6' }} />
                      <Bar dataKey="Earnings" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="authority-empty" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No earnings recorded yet</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
