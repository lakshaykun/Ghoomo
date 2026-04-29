import React, { useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const ROUTE_META = {
  '/dashboard': {
    kicker: 'Control room',
    title: 'Dashboard',
    description: 'Live transport oversight with core counts, alerts, and the latest operational movement.',
  },
  '/routes': {
    kicker: 'Route planning',
    title: 'Bus Routes',
    description: 'Review bus routes, stops, and booking distribution from the operations desk.',
  },
  '/drivers': {
    kicker: 'Fleet control',
    title: 'Drivers',
    description: 'Review driver status, live location snapshots, and enable or disable accounts quickly.',
  },
  '/students': {
    kicker: 'Student directory',
    title: 'Students',
    description: 'Search riders, inspect contact details, and see their most recent trip at a glance.',
  },
  '/rides': {
    kicker: 'Ride log',
    title: 'Rides',
    description: 'Track trip history and filter the fleet by operational status without extra navigation.',
  },
  '/live-monitoring': {
    kicker: 'Live monitoring',
    title: 'Live Monitoring',
    description: 'Watch active rides, queue pressure, and driver coverage with auto-refresh enabled.',
  },
  '/campus-boundary': {
    kicker: 'Campus control',
    title: 'Campus Boundary',
    description: 'Draw and manage the campus geofence that powers driver campus monitoring.',
  },
  '/popular-places': {
    kicker: 'Location management',
    title: 'Popular Places',
    description: 'Manage campus landmarks and common pickup/drop points for quick selection.',
  },
  '/bus-management': {
    kicker: 'Fleet Logistics',
    title: 'Bus Management',
    description: 'Manage routes, stops, and schedules for the campus bus fleet.',
  },
};

export default function AdminLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const routeMeta = useMemo(() => ROUTE_META[location.pathname] || ROUTE_META['/dashboard'], [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="lg:pl-72">
        <Topbar
          kicker={routeMeta.kicker}
          title={routeMeta.title}
          description={routeMeta.description}
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
