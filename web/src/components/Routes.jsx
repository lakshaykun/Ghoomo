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
        <button onClick={() => setShowForm(!showForm)} className="btn-create">
          + Create Route
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="route-form">
          <input
            type="text"
            placeholder="Route Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Start Point"
            value={formData.startPoint}
            onChange={(e) => setFormData({ ...formData, startPoint: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="End Point"
            value={formData.endPoint}
            onChange={(e) => setFormData({ ...formData, endPoint: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Stops (comma-separated)"
            value={formData.stops}
            onChange={(e) => setFormData({ ...formData, stops: e.target.value })}
          />
          <button type="submit" className="btn-submit">Create</button>
          <button type="button" onClick={() => setShowForm(false)} className="btn-cancel">Cancel</button>
        </form>
      )}

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Start Point</th>
              <th>End Point</th>
              <th>Stops</th>
              <th>Active Buses</th>
              <th>Passengers</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <tr key={route.id}>
                <td>{route.name}</td>
                <td>{route.startPoint}</td>
                <td>{route.endPoint}</td>
                <td>{route.stops}</td>
                <td>{route.activeBuses || 0}</td>
                <td>{route.passengers || 0}</td>
                <td><span className={`status-badge ${route.status}`}>{route.status}</span></td>
                <td className="actions">
                  <button onClick={() => handleDelete(route.id)} className="btn-delete">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
