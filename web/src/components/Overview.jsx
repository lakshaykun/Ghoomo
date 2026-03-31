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

  return (
    <div className="overview">
      <h2 className="page-title">Dashboard Overview</h2>

      <div className="stats-grid">
        <StatCard
          title="Total Rides"
          value={summary.totalRides || 0}
          icon="🚗"
          color="#3B82F6"
        />
        <StatCard
          title="Active Drivers"
          value={summary.activeDrivers || 0}
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
          title="Total Revenue"
          value={`$${(summary.totalRevenue || 0).toLocaleString()}`}
          icon="💰"
          color="#F59E0B"
        />
        <StatCard
          title="Pending Rides"
          value={summary.driversOnTrip || 0}
          icon="⏳"
          color="#EF4444"
        />
        <StatCard
          title="Completed Rides"
          value={summary.completedRides || 0}
          icon="⭐"
          color="#EC4899"
        />
      </div>

      <div className="overview-tables">
        <div className="table-card">
          <h3>Recent Bookings</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Driver</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(data.recentBookings || []).map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{booking.userName || booking.userId || '-'}</td>
                  <td>{booking.type === 'bus' ? 'Bus' : (booking.type || '-')}</td>
                  <td><span className={`status-badge ${booking.status}`}>{booking.status}</span></td>
                  <td>{booking.fare ? `$${booking.fare}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-card">
          <h3>Active Drivers</h3>
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
              {(data.drivers || []).map((driver) => (
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
        🔄 Refresh
      </button>
    </div>
  );
}
