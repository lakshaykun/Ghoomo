import React, { useEffect, useState } from 'react';
import dashboardAPI from '../services/dashboardAPI';
import StatCard from './StatCard';
import '../styles/Overview.css';

export default function Overview() {
  const [overview, setOverview] = useState({ stats: null, recentUsers: [], recentRides: [], routes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getOverviewData();
      setOverview(data);
    } catch (err) {
      setError(err?.message || 'Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  const summary = overview.stats || {};
  const recentUsers = overview.recentUsers || [];
  const recentRides = overview.recentRides || [];
  const routes = overview.routes || [];
  const completionRate = summary.totalRides > 0 ? Math.round((summary.completedRides / summary.totalRides) * 100) : 0;
  const activeRideShare = summary.totalRides > 0 ? Math.round((summary.activeRides / summary.totalRides) * 100) : 0;
  const totalRevenue = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(summary.totalRevenue || 0);

  return (
    <div className="overview">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div>
          <h2 className="page-title">Operations Dashboard</h2>
          <p style={{ maxWidth: '720px', color: 'var(--ink-600)', lineHeight: 1.6 }}>
            Live platform summary built from the backend database. Review ride throughput, user growth,
            active drivers, and bus route coverage from one place.
          </p>
        </div>

        <button onClick={fetchOverview} className="refresh-btn">
          Refresh Dashboard
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Users"
          value={summary.totalUsers || 0}
          icon="👥"
          color="#0f766e"
        />
        <StatCard
          title="Drivers"
          value={summary.totalDrivers || 0}
          icon="🚘"
          color="#f97316"
        />
        <StatCard
          title="Bus Drivers"
          value={summary.totalBusDrivers || 0}
          icon="🚌"
          color="#155e75"
        />
        <StatCard
          title="Ride Requests"
          value={summary.totalRideRequests || 0}
          icon="📨"
          color="#8b5cf6"
        />
        <StatCard
          title="Active Rides"
          value={summary.activeRides || 0}
          icon="⏱️"
          color="#d97706"
        />
        <StatCard
          title="Revenue"
          value={`₹${totalRevenue}`}
          icon="💰"
          color="#16a34a"
        />
      </div>

      <div className="insights-grid">
        <div className="insight-card">
          <p>Completion Rate</p>
          <h3>{completionRate}%</h3>
          <span>Completed rides out of all tracked rides</span>
        </div>
        <div className="insight-card">
          <p>Active Ride Share</p>
          <h3>{activeRideShare}%</h3>
          <span>{summary.activeRides || 0} active rides out of {summary.totalRides || 0}</span>
        </div>
        <div className="insight-card">
          <p>Bus Coverage</p>
          <h3>{summary.totalBusRoutes || 0}</h3>
          <span>{summary.totalBusBookings || 0} bookings recorded</span>
        </div>
      </div>

      <div className="overview-tables">
        <div className="table-card">
          <h3>Recent Users</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name || '-'}</td>
                  <td>{user.email || '-'}</td>
                  <td>{user.role || '-'}</td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-card">
          <h3>Recent Rides</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Ride</th>
                <th>Student</th>
                <th>Driver</th>
                <th>Fare</th>
                <th>Distance</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentRides.map((ride) => (
                <tr key={ride.id}>
                  <td>{ride.requestId || ride.id}</td>
                  <td>{ride.studentId || '-'}</td>
                  <td>{ride.driverId || '-'}</td>
                  <td>{ride.fare !== null ? `₹${Number(ride.fare).toLocaleString('en-IN')}` : '-'}</td>
                  <td>{ride.distance !== null ? `${Number(ride.distance).toFixed(1)} km` : '-'}</td>
                  <td><span className={`status-badge ${ride.status}`}>{ride.status}</span></td>
                  <td>{ride.createdAt ? new Date(ride.createdAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-card">
          <h3>Bus Routes</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Departure</th>
                <th>Arrival</th>
                <th>Stops</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id}>
                  <td>{route.name}</td>
                  <td>{route.departureTime || '-'}</td>
                  <td>{route.arrivalTime || '-'}</td>
                  <td>{route.stops?.length || 0}</td>
                  <td>{route.updatedAt ? new Date(route.updatedAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
