import React, { useState, useEffect } from 'react';
import dashboardAPI from '../services/dashboardAPI';
import '../styles/Rides.css';

export default function Rides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRides();
  }, [filter]);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await dashboardAPI.getRides(params);
      setRides(response.data);
    } catch (err) {
      console.error('Failed to fetch rides:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (rideId) => {
    if (window.confirm('Are you sure you want to cancel this ride?')) {
      try {
        await dashboardAPI.cancelRide(rideId);
        fetchRides();
      } catch (err) {
        console.error('Failed to cancel ride:', err);
      }
    }
  };

  const handleComplete = async (rideId) => {
    try {
      await dashboardAPI.completeRide(rideId);
      fetchRides();
    } catch (err) {
      console.error('Failed to complete ride:', err);
    }
  };

  if (loading) return <div className="loading">Loading rides...</div>;

  return (
    <div className="rides-page">
      <h2>Ride Management</h2>

      <div className="filter-box">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button
          className={`filter-btn ${filter === 'in_progress' ? 'active' : ''}`}
          onClick={() => setFilter('in_progress')}
        >
          In Progress
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
        <button
          className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilter('cancelled')}
        >
          Cancelled
        </button>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Driver</th>
              <th>Pickup</th>
              <th>Dropoff</th>
              <th>Distance</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rides.map((ride) => (
              <tr key={ride.id}>
                <td>{ride.id}</td>
                <td>{ride.userName}</td>
                <td>{ride.driverName}</td>
                <td>{ride.pickupLocation}</td>
                <td>{ride.dropoffLocation}</td>
                <td>{ride.distance} km</td>
                <td>${ride.fare}</td>
                <td><span className={`status-badge ${ride.status}`}>{ride.status}</span></td>
                <td className="actions">
                  {ride.status === 'pending' && (
                    <button onClick={() => handleCancel(ride.id)} className="btn-cancel">
                      Cancel
                    </button>
                  )}
                  {ride.status === 'in_progress' && (
                    <button onClick={() => handleComplete(ride.id)} className="btn-complete">
                      Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
