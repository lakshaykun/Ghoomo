import React, { useState, useEffect } from 'react';
import dashboardAPI from '../services/dashboardAPI';
import '../styles/Routes.css';

export default function Routes_Component() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startPoint: '',
    endPoint: '',
    stops: '',
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getRoutes();
      setRoutes(response.data);
    } catch (err) {
      console.error('Failed to fetch routes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await dashboardAPI.createRoute(formData);
      setFormData({ name: '', startPoint: '', endPoint: '', stops: '' });
      setShowForm(false);
      fetchRoutes();
    } catch (err) {
      console.error('Failed to create route:', err);
    }
  };

  const handleDelete = async (routeId) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      try {
        await dashboardAPI.deleteRoute(routeId);
        fetchRoutes();
      } catch (err) {
        console.error('Failed to delete route:', err);
      }
    }
  };

  if (loading) return <div className="loading">Loading routes...</div>;

  return (
    <div className="routes-page">
      <div className="routes-header">
        <h2>Route Management</h2>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Start Point</th>
              <th>End Point</th>
              <th>Stops</th>
              <th>Total Seats</th>
              <th>Passengers</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <tr key={route.id}>
                <td>{route.name}</td>
                <td>{route.from}</td>
                <td>{route.to}</td>
                <td>{Array.isArray(route.stops) ? route.stops.join(', ') : (route.stops || '-')}</td>
                <td>{route.totalSeats || 0}</td>
                <td>{route.bookedSeats || 0}</td>
                <td><span className={`status-badge ${route.availableSeats > 0 ? 'active' : 'suspended'}`}>{route.availableSeats > 0 ? 'active' : 'full'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
