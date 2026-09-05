import React, { useState } from 'react';
import { SocietyProvider } from '../../context/SocietyContext';
import { LayoutDashboard, Users, Briefcase, IndianRupee, Settings, AlertCircle, HeartHandshake, LogOut } from 'lucide-react';
import DashboardPage from '../DashboardPage';
import WorkersPage from '../WorkersPage';
import BookingsPage from '../BookingsPage';
import PaymentsPage from '../PaymentsPage';
import RatesPage from '../RatesPage';
import ComplaintsPage from '../ComplaintsPage';
import WelfarePage from '../WelfarePage';

// Simple wrapper to provide context to the dashboard
const SocietyApp = ({ session, onLogout }) => {
  return (
    <SocietyProvider>
      <SocietyDashboard session={session} onLogout={onLogout} />
    </SocietyProvider>
  );
};

const SocietyDashboard = ({ session, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const society = session.data;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'workers', label: 'Workers', icon: <Users size={20} /> },
    { id: 'bookings', label: 'Bookings', icon: <Briefcase size={20} /> },
    { id: 'payments', label: 'Payments', icon: <IndianRupee size={20} /> },
    { id: 'rates', label: 'Rate Cards', icon: <Settings size={20} /> },
    { id: 'complaints', label: 'Complaints', icon: <AlertCircle size={20} /> },
    { id: 'welfare', label: 'Welfare', icon: <HeartHandshake size={20} /> },
  ];

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
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="nav-icon">{tab.icon}</div>
              {tab.label}
            </button>
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
            {tabs.find(t => t.id === activeTab)?.label}
          </div>
          <div className="topbar-actions">
            <div className="user-avatar">{society?.name?.charAt(0) || 'S'}</div>
          </div>
        </header>

        <div className="page-content">
          {activeTab === 'dashboard' && <DashboardPage />}
          {activeTab === 'workers' && <WorkersPage />}
          {activeTab === 'bookings' && <BookingsPage />}
          {activeTab === 'payments' && <PaymentsPage />}
          {activeTab === 'rates' && <RatesPage />}
          {activeTab === 'complaints' && <ComplaintsPage />}
          {activeTab === 'welfare' && <WelfarePage />}
        </div>
      </main>
    </div>
  );
};

export default SocietyApp;
