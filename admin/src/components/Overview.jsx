import React, { useEffect, useState } from 'react';
import dashboardAPI from '../services/dashboardAPI';
import StatCard from './StatCard';
import '../styles/Overview.css';

export default function Overview() {
  const [overview, setOverview] = useState({ stats: null, recentUsers: [], recentRides: [], routes: [], live: {}, health: {} });
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
  const live = overview.live || {};
  const health = overview.health || {};
  const recentUsers = overview.recentUsers || [];
  const recentRides = overview.recentRides || [];
  const routes = overview.routes || [];
  const completionRate = summary.totalRides > 0 ? Math.round((summary.completedRides / summary.totalRides) * 100) : 0;
  const availabilityRate = summary.totalDrivers > 0 ? Math.round((summary.availableDrivers / summary.totalDrivers) * 100) : 0;
  const queuePressure = (live.pendingRideRequests || 0) + (live.pendingCandidateOffers || 0);
  const totalRevenue = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(summary.totalRevenue || 0);

  return (
    <div className="overview">
      <div className="overview-hero">
        <div>
          <p className="overview-eyebrow">Executive Summary</p>
          <h2 className="page-title">Operations Dashboard</h2>
          <p className="overview-subtitle">
            Live platform summary built from the backend database. Review ride throughput, user growth,
            active drivers, and bus route coverage from one place.
          </p>
          <div className="overview-chips">
            <span className={`overview-chip ${health.status === 'healthy' ? 'healthy' : 'warning'}`}>
              {health.status || 'unknown'}
            </span>
            <span className="overview-chip">{health.environment || 'unknown'}</span>
            <span className="overview-chip">Updated {overview.generatedAt ? new Date(overview.generatedAt).toLocaleString() : '-'}</span>
          </div>
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
          title="Available Drivers"
          value={summary.availableDrivers || 0}
          icon="🟢"
          color="#16a34a"
        />
        <StatCard
          title="Active Rides"
          value={summary.activeRides || 0}
          icon="⏱️"
          color="#d97706"
        />
        <StatCard
          title="Pending Requests"
          value={summary.searchingRideRequests || 0}
          icon="📨"
          color="#8b5cf6"
        />
        <StatCard
          title="Revenue"
          value={`₹${totalRevenue}`}
          icon="💰"
          color="#16a34a"
        />
        <StatCard
          title="Bus Bookings"
          value={summary.totalBusBookings || 0}
          icon="🚌"
          color="#155e75"
        />
      </div>

      <div className="insights-grid">
        <div className="insight-card">
          <p>Completion Rate</p>
          <h3>{completionRate}%</h3>
          <span>Completed rides out of all tracked rides</span>
        </div>
        <div className="insight-card">
          <p>Driver Availability</p>
          <h3>{availabilityRate}%</h3>
          <span>{summary.availableDrivers || 0} available drivers out of {summary.totalDrivers || 0}</span>
        </div>
        <div className="insight-card">
          <p>Queue Pressure</p>
          <h3>{queuePressure}</h3>
          <span>Open ride requests and candidate offers waiting on action</span>
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
              {recentUsers.length === 0 ? (
                <tr>
                  <td colSpan="4">No recent users yet.</td>
                </tr>
              ) : recentUsers.map((user) => (
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
                <th>Pickup</th>
                <th>Drop</th>
                <th>Fare</th>
                <th>Distance</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentRides.length === 0 ? (
                <tr>
                  <td colSpan="9">No recent rides yet.</td>
                </tr>
              ) : recentRides.map((ride) => (
                <tr key={ride.id}>
                  <td>{ride.requestId || ride.id}</td>
                  <td>{ride.studentName || ride.studentId || '-'}</td>
                  <td>{ride.driverName || ride.driverId || '-'}</td>
                  <td>{ride.pickupLocation || '-'}</td>
                  <td>{ride.dropLocation || '-'}</td>
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
              {routes.length === 0 ? (
                <tr>
                  <td colSpan="5">No bus routes are available yet.</td>
                </tr>
              ) : routes.map((route) => (
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
