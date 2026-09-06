import React from 'react';
import { NavLink, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { SocietyProvider, useSociety } from '../../context/SocietyContext';
import { LayoutDashboard, Users, Briefcase, IndianRupee, Settings, AlertCircle, HeartHandshake, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import DashboardPage from '../DashboardPage';
import WorkersPage from '../WorkersPage';
import BookingsPage from '../BookingsPage';
import PaymentsPage from '../PaymentsPage';
import RatesPage from '../RatesPage';
import ComplaintsPage from '../ComplaintsPage';
import WelfarePage from '../WelfarePage';

// Simple wrapper to provide context to the dashboard
const SocietyApp = () => {
  const { user, signOut } = useAuth();
  return (
    <SocietyProvider society={user}>
      <SocietyDashboard society={user} onLogout={() => signOut()} />
    </SocietyProvider>
  );
};

const SocietyDashboard = ({ society, onLogout }) => {
  const { error } = useSociety();
  const tabs = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/dashboard/workers', label: 'Workers', icon: <Users size={20} /> },
    { path: '/dashboard/bookings', label: 'Bookings', icon: <Briefcase size={20} /> },
    { path: '/dashboard/payments', label: 'Payments', icon: <IndianRupee size={20} /> },
    { path: '/dashboard/rates', label: 'Rate Cards', icon: <Settings size={20} /> },
    { path: '/dashboard/complaints', label: 'Complaints', icon: <AlertCircle size={20} /> },
    { path: '/dashboard/welfare', label: 'Welfare', icon: <HeartHandshake size={20} /> },
  ];
  const location = useLocation();
  const activeTab = tabs.find((tab) => tab.path === location.pathname) ?? tabs.find((tab) => location.pathname.startsWith(`${tab.path}/`)) ?? tabs[0];

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">G</div>
          <div className="logo-text">
            <h1>GigMat</h1>
            <span>Society Portal</span>
          </div>
        </div>

        <div className="sidebar-society">
          <div className="society-label">Active Society</div>
          <div className="society-name">{society?.name || 'Society Admin'}</div>
          <div className="society-id">{society?.code || society?.id}</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {tabs.map(tab => (
            <NavLink key={tab.path} to={tab.path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end={tab.path === '/dashboard'}>
              <div className="nav-icon">{tab.icon}</div>
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={onLogout} style={{ color: 'var(--danger)' }}>
            <div className="nav-icon"><LogOut size={20} /></div>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            {activeTab.label}
          </div>
          <div className="topbar-actions">
            <div className="user-avatar">{society?.name?.charAt(0) || 'S'}</div>
          </div>
        </header>

        <div className="page-content">
          {error && <div className="alert alert-danger" role="alert">Unable to load all Society data: {error}</div>}
          <Routes>
            <Route index element={<DashboardPage />} />
            <Route path="workers" element={<WorkersPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="rates" element={<RatesPage />} />
            <Route path="complaints" element={<ComplaintsPage />} />
            <Route path="welfare" element={<WelfarePage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default SocietyApp;
