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

  return (
    <div className="overview">
      <h2 className="page-title">Dashboard Overview</h2>

      <div className="stats-grid">
        <StatCard
          title="Total Rides"
          value={data.totalRides || 0}
          icon="🚗"
          color="#3B82F6"
        />
        <StatCard
          title="Active Drivers"
          value={data.activeDrivers || 0}
          icon="👨‍💼"
          color="#10B981"
        />
        <StatCard
          title="Total Users"
          value={data.totalUsers || 0}
          icon="👥"
          color="#8B5CF6"
        />
        <StatCard
          title="Total Revenue"
          value={`$${(data.totalRevenue || 0).toLocaleString()}`}
          icon="💰"
          color="#F59E0B"
        />
        <StatCard
          title="Pending Rides"
          value={data.pendingRides || 0}
          icon="⏳"
          color="#EF4444"
        />
        <StatCard
          title="Avg Rating"
          value={(data.avgRating || 0).toFixed(1)}
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
              {data.recentBookings?.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{booking.user}</td>
                  <td>{booking.driver}</td>
                  <td><span className={`status-badge ${booking.status}`}>{booking.status}</span></td>
                  <td>{booking.amount}</td>
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
              {data.drivers?.map((driver) => (
                <tr key={driver.id}>
                  <td>{driver.name}</td>
                  <td>{driver.vehicle}</td>
                  <td>{driver.rating}</td>
                  <td>{driver.rides}</td>
                  <td><span className={`status-badge ${driver.status}`}>{driver.status}</span></td>
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
