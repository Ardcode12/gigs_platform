import { useSociety } from '../context/SocietyContext';
import { formatCurrency } from '../constants';
import { Briefcase, IndianRupee, Users, AlertCircle } from 'lucide-react';
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
        </>
      )}
    </div>
  );
}
