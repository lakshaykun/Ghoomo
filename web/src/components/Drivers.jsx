import React, { useState, useEffect } from 'react';
import dashboardAPI from '../services/dashboardAPI';
import '../styles/Drivers.css';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getDrivers();
      setDrivers(response.data);
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (driverId) => {
    try {
      await dashboardAPI.suspendDriver(driverId);
      fetchDrivers();
    } catch (err) {
      console.error('Failed to suspend driver:', err);
    }
  };

  const handleActivate = async (driverId) => {
    try {
      await dashboardAPI.activateDriver(driverId);
      fetchDrivers();
    } catch (err) {
      console.error('Failed to activate driver:', err);
    }
  };

  const filteredDrivers = drivers.filter(d =>
    d.email?.toLowerCase().includes(search.toLowerCase()) ||
    d.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading">Loading drivers...</div>;

  return (
    <div className="drivers-page">
      <h2>Driver Management</h2>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Vehicle</th>
              <th>License</th>
              <th>Rating</th>
              <th>Rides</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredDrivers.map((driver) => (
              <tr key={driver.id}>
                <td>{driver.name}</td>
                <td>{driver.email}</td>
                <td>{driver.vehicleType || '-'}</td>
                <td>{driver.licenseNumber || '-'}</td>
                <td>⭐ {driver.rating || '-'}</td>
                <td>{driver.totalRides || 0}</td>
                <td><span className={`status-badge ${driver.online ? 'active' : 'inactive'}`}>{driver.online ? 'active' : 'inactive'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
