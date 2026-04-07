import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Overview from '../components/Overview';
import Monitoring from '../components/Monitoring';
import Users from '../components/Users';
import Drivers from '../components/Drivers';
import Rides from '../components/Rides';
import BusRoutes from '../components/Routes';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';

const SECTION_META = {
  overview: {
    kicker: 'Executive Summary',
    title: 'Platform Overview',
    description: 'High-level platform snapshot with live operations, revenue, and recent activity.',
  },
  monitoring: {
    kicker: 'Operations Center',
    title: 'Live Monitoring',
    description: 'Trend charts, queue health, and route-level activity for day-to-day oversight.',
  },
  users: {
    kicker: 'Directory',
    title: 'User Management',
    description: 'Browse the user directory and review the latest account records.',
  },
  drivers: {
    kicker: 'Fleet Control',
    title: 'Driver Management',
    description: 'Inspect driver profiles, availability, and nearby live coverage.',
  },
  rides: {
    kicker: 'Trip Control',
    title: 'Ride Management',
    description: 'Review ride lifecycle records and status transitions.',
  },
  routes: {
    kicker: 'Transit Planner',
    title: 'Bus Route Management',
    description: 'Create routes, attach stops, and track the active route catalog.',
  },
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sectionKey = location.pathname.split('/').filter(Boolean)[1] || 'overview';
  const section = SECTION_META[sectionKey] || SECTION_META.overview;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard-container">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation"
            >
              ☰
            </button>
            <div>
              <p className="header-kicker">{section.kicker}</p>
              <h2>{section.title}</h2>
              <p className="header-copy">{section.description}</p>
            </div>
          </div>
          <div className="header-right">
            <span className="user-info">{user?.name || user?.email}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </header>

        <main className="dashboard-content">
          <Routes>
            <Route path="/" element={<Navigate to="overview" replace />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/users" element={<Users />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/rides" element={<Rides />} />
            <Route path="/routes" element={<BusRoutes />} />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
