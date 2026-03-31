import React, { useState, useEffect } from 'react';
import dashboardAPI from '../services/dashboardAPI';
import StatCard from './StatCard';
import '../styles/Overview.css';

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (err) {
      setError('Failed to load dashboard stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  const data = stats || {};
  const summary = data.stats || {};
  const rides = data.rides || [];
  const onlineDrivers = summary.activeDrivers || 0;
  const totalDrivers = summary.totalDrivers || data.drivers?.length || 0;
  const completedRides = summary.completedRides || 0;
  const totalRides = summary.totalRides || 0;
  const completionRate = totalRides > 0 ? Math.round((completedRides / totalRides) * 100) : 0;
  const driverUtilization = totalDrivers > 0 ? Math.round((onlineDrivers / totalDrivers) * 100) : 0;
  const activeTrips = rides.filter((ride) => ['accepted', 'arrived', 'in_progress'].includes(ride.status)).length;

  return (
    <div className="overview">
      <h2 className="page-title">Operations Dashboard</h2>

      <div className="stats-grid">
        <StatCard
          title="Total Rides"
          value={totalRides}
          icon="🚗"
          color="#3B82F6"
        />
        <StatCard
          title="Active Drivers"
          value={onlineDrivers}
          icon="👨‍💼"
          color="#10B981"
        />
        <StatCard
          title="Total Users"
          value={summary.totalUsers || 0}
          icon="👥"
          color="#8B5CF6"
        />
        <StatCard
          title="Live Trips"
          value={activeTrips}
          icon="📍"
          color="#F59E0B"
        />
        <StatCard
          title="Drivers On Trip"
          value={summary.driversOnTrip || activeTrips}
          icon="⏳"
          color="#EF4444"
        />
        <StatCard
          title="Completed Rides"
          value={completedRides}
          icon="⭐"
          color="#EC4899"
        />
      </div>

      <div className="insights-grid">
        <div className="insight-card">
          <p>Completion Rate</p>
          <h3>{completionRate}%</h3>
          <span>Completed rides out of all booked rides</span>
        </div>
        <div className="insight-card">
          <p>Driver Availability</p>
          <h3>{driverUtilization}%</h3>
          <span>{onlineDrivers} online out of {totalDrivers} drivers</span>
        </div>
        <div className="insight-card">
          <p>Route Demand</p>
          <h3>{summary.waitingList || 0}</h3>
          <span>Passengers currently in waitlist</span>
        </div>
      </div>

      <div className="overview-tables">
        <div className="table-card">
          <h3>Recent Activity</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>User</th>
                <th>Details</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {(data.recentBookings || []).map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{booking.type === 'bus' ? 'Bus' : (booking.type || 'Ride')}</td>
                  <td>{booking.userName || booking.userId || '-'}</td>
                  <td>{booking.detail || booking.label || '-'}</td>
                  <td><span className={`status-badge ${booking.status}`}>{booking.status}</span></td>
                  <td>{booking.createdAt ? new Date(booking.createdAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-card">
          <h3>Driver Availability</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Vehicle</th>
                <th>Rating</th>
                <th>Rides</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data.drivers || []).slice(0, 10).map((driver) => (
                <tr key={driver.id}>
                  <td>{driver.name}</td>
                  <td>{driver.vehicleType || '-'}</td>
                  <td>{driver.rating || '-'}</td>
                  <td>{driver.totalRides || 0}</td>
                  <td><span className={`status-badge ${driver.online ? 'active' : 'inactive'}`}>{driver.online ? 'active' : 'inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button onClick={fetchStats} className="refresh-btn">
        Refresh Dashboard
      </button>
    </div>
  );
}
